const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function createDatabase(databasePath) {
  const dir = path.dirname(databasePath);
  fs.mkdirSync(dir, { recursive: true });

  const db = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pr_id INTEGER NOT NULL,
      repo_full_name TEXT NOT NULL,
      pr_title TEXT,
      pr_url TEXT,
      status TEXT NOT NULL,
      review_payload TEXT,
      error_message TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(pr_id, repo_full_name)
    );
  `);

  return db;
}

async function upsertQueuedReview(db, review) {
  await db.run(
    `
    INSERT INTO reviews (pr_id, repo_full_name, pr_title, pr_url, status)
    VALUES (?, ?, ?, ?, 'queued')
    ON CONFLICT(pr_id, repo_full_name)
    DO UPDATE SET
      pr_title = excluded.pr_title,
      pr_url = excluded.pr_url,
      status = 'queued',
      error_message = NULL,
      review_payload = NULL,
      started_at = NULL,
      completed_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    `,
    review.prId,
    review.repoFullName,
    review.prTitle,
    review.prUrl,
  );
}

async function markReviewProcessing(db, prId, repoFullName) {
  await db.run(
    `UPDATE reviews SET status = 'processing', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE pr_id = ? AND repo_full_name = ?`,
    prId,
    repoFullName,
  );
}

async function markReviewCompleted(db, prId, repoFullName, payload) {
  await db.run(
    `UPDATE reviews SET status = 'completed', review_payload = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE pr_id = ? AND repo_full_name = ?`,
    JSON.stringify(payload),
    prId,
    repoFullName,
  );
}

async function markReviewFailed(db, prId, repoFullName, errorMessage) {
  await db.run(
    `UPDATE reviews SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE pr_id = ? AND repo_full_name = ?`,
    errorMessage,
    prId,
    repoFullName,
  );
}

async function getReviewByPrId(db, prId, repoFullName) {
  const review = repoFullName
    ? await db.get(`SELECT * FROM reviews WHERE pr_id = ? AND repo_full_name = ?`, prId, repoFullName)
    : await db.get(`SELECT * FROM reviews WHERE pr_id = ? ORDER BY updated_at DESC LIMIT 1`, prId);

  if (!review) return null;

  return {
    ...review,
    review_payload: review.review_payload ? JSON.parse(review.review_payload) : null,
  };
}

async function getStats(db) {
  const summary = await db.get(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN status IN ('queued', 'processing') THEN 1 ELSE 0 END) AS in_progress
    FROM reviews
  `);

  const duration = await db.get(`
    SELECT AVG((julianday(completed_at) - julianday(started_at)) * 86400.0) AS avg_review_seconds
    FROM reviews
    WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
  `);

  return {
    ...summary,
    avg_review_seconds: duration?.avg_review_seconds ? Number(duration.avg_review_seconds.toFixed(2)) : null,
  };
}

module.exports = {
  createDatabase,
  upsertQueuedReview,
  markReviewProcessing,
  markReviewCompleted,
  markReviewFailed,
  getReviewByPrId,
  getStats,
};
