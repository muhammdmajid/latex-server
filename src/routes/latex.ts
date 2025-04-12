import express from 'express';
import { StatusCodes } from 'http-status-codes';
import type { Request, Response, NextFunction } from 'express';
import sendResponse from '@/middlewares/sendResponse.js';

const router = express.Router();

/**
 * GET /
 * Latex-IT server status check with error handling
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Simulate status check or any logic
    const message = '✅ Latex-IT server is up and running!';
    const success = true;
    const responseObject = {}; // No specific data for status check

    // Using sendResponse helper for structured response
    sendResponse(res, success, message, responseObject, StatusCodes.OK);

  } catch (error) {
    console.error('Error in GET / route:', error);
    next(error); // Passes error to Express error handler middleware
  }
});

export default router;
