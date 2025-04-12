import type { Request,} from 'express';
import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import env from '@/config/config.js';
import { ServiceResponse } from '@/utils/service-response.js';


const rateLimiter: RateLimitRequestHandler = rateLimit({
  legacyHeaders: true,
  standardHeaders: true,
  windowMs: 15 * 60 * env.COMMON_RATE_LIMIT_WINDOW_MS, // 15 minutes
  limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: (req: Request): string => req.ip || '',

  // Explicitly typed parameters to satisfy TypeScript
  message: (_req: Request, req: Request): object =>
    ServiceResponse.failure(
      'Too many requests, please try again later.',
      StatusCodes.TOO_MANY_REQUESTS
    ),

  statusCode: StatusCodes.TOO_MANY_REQUESTS,
});

export default rateLimiter;
