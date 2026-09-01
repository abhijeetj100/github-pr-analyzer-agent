const express = require('express');
const { getReviewByPrId, getStats } = require('../db');

function createReviewsRouter({ db }) {
  const router = express.Router();

  router.get('/reviews/:prId', async (req, res, next) => {
    try {
      const prId = Number(req.params.prId);
      if (Number.isNaN(prId)) {
        return res.status(400).json({ error: 'Invalid prId' });
      }

      const review = await getReviewByPrId(db, prId, req.query.repo);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      return res.json(review);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/stats', async (req, res, next) => {
    try {
      const stats = await getStats(db);
      return res.json(stats);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createReviewsRouter };
