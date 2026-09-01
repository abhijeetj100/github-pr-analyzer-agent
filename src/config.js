const path = require('path');

const config = {
  port: Number(process.env.PORT || 3000),
  databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'reviews.db'),
  queueConcurrency: Number(process.env.QUEUE_CONCURRENCY || 2),
  webhookRateLimitWindowMs: Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS || 60000),
  webhookRateLimitMax: Number(process.env.WEBHOOK_RATE_LIMIT_MAX || 30),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
  githubToken: process.env.GITHUB_TOKEN,
};

module.exports = { config };
