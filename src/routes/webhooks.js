const express = require('express');
const { z } = require('zod');
const { upsertQueuedReview } = require('../db');

const actionSchema = z.enum(['opened', 'reopened', 'synchronize']);

function createWebhooksRouter({ db, queue, enqueueReview }) {
  const router = express.Router();

  router.post('/github', async (req, res, next) => {
    try {
      const githubEvent = req.header('x-github-event');
      if (githubEvent !== 'pull_request') {
        return res.status(202).json({ accepted: true, ignored: true, reason: 'Unsupported event' });
      }

      const payload = req.body;
      const parseAction = actionSchema.safeParse(payload.action);
      if (!parseAction.success || !payload.pull_request || !payload.repository?.full_name) {
        return res.status(202).json({ accepted: true, ignored: true, reason: 'Unsupported pull request payload' });
      }

      const reviewJob = {
        prId: payload.pull_request.number,
        prTitle: payload.pull_request.title,
        prBody: payload.pull_request.body,
        prUrl: payload.pull_request.html_url,
        diffUrl: payload.pull_request.diff_url,
        repoFullName: payload.repository.full_name,
      };

      await upsertQueuedReview(db, reviewJob);
      queue.add(() => enqueueReview(reviewJob)).catch((error) => {
        console.error('Review job failed:', error.message);
      });

      return res.status(202).json({ accepted: true, queueSize: queue.size + queue.pending });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createWebhooksRouter };
