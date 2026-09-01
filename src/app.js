const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { config } = require('./config');
const { createDatabase } = require('./db');
const { AsyncQueue } = require('./queue');
const { ClaudeReviewService } = require('./services/claudeReviewService');
const { processReviewJob } = require('./services/reviewWorker');
const { createWebhooksRouter } = require('./routes/webhooks');
const { createReviewsRouter } = require('./routes/reviews');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

async function createApp(overrides = {}) {
  const app = express();

  const runtimeConfig = { ...config, ...overrides.config };
  const db = overrides.db || (await createDatabase(runtimeConfig.databasePath));
  const queue =
    overrides.queue ||
    new AsyncQueue({
      concurrency: runtimeConfig.queueConcurrency,
    });
  const claudeService =
    overrides.claudeService ||
    new ClaudeReviewService({
      apiKey: runtimeConfig.anthropicApiKey,
      model: runtimeConfig.anthropicModel,
    });

  app.use(cors());
  app.use(express.json({ limit: '3mb' }));
  app.use(morgan('dev'));

  app.use(
    '/webhooks',
    rateLimit({
      windowMs: runtimeConfig.webhookRateLimitWindowMs,
      max: runtimeConfig.webhookRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  const enqueueReview = async (job) =>
    processReviewJob({
      db,
      claudeService,
      githubToken: runtimeConfig.githubToken,
      job,
    });

  app.use('/webhooks', createWebhooksRouter({ db, queue, enqueueReview }));
  app.use('/', createReviewsRouter({ db }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.db = db;
  app.locals.queue = queue;

  return app;
}

module.exports = { createApp };
