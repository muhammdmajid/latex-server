import express from 'express';

const router = express.Router();

/**
 * GET /
 * Latex-IT server status check with error handling
 */
router.get('/', async (_req, res, next) => {
  try {
    // Simulate status check or any logic
    res.status(200).send('✅ Latex-IT server is up and running!');
  } catch (error) {
    console.error('Error in GET / route:', error);
    next(error); // Passes error to Express error handler middleware
  }
});

export default router;
