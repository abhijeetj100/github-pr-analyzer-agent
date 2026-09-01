const {
  markReviewProcessing,
  markReviewCompleted,
  markReviewFailed,
} = require('../db');

async function fetchDiff(diffUrl, githubToken) {
  const headers = {
    Accept: 'application/vnd.github.v3.diff',
    'User-Agent': 'github-pr-analyzer-agent',
  };

  if (githubToken) {
    headers.Authorization = 'Bearer ' + githubToken;
  }

  const response = await fetch(diffUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch PR diff (${response.status})`);
  }

  const diff = await response.text();
  return diff.slice(0, 120000);
}

async function processReviewJob({ db, claudeService, githubToken, job }) {
  const { prId, repoFullName, prTitle, prBody, prUrl, diffUrl } = job;

  await markReviewProcessing(db, prId, repoFullName);

  try {
    const diff = await fetchDiff(diffUrl, githubToken);
    const analysis = await claudeService.analyzePullRequest({
      prId,
      repoFullName,
      prTitle,
      prBody,
      prUrl,
      diff,
    });

    await markReviewCompleted(db, prId, repoFullName, analysis);
  } catch (error) {
    await markReviewFailed(db, prId, repoFullName, error.message);
    throw error;
  }
}

module.exports = { processReviewJob };
