import { rateLimit } from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'
import env from './../config/config.js'
import ServiceResponse from './../utils/service-response.js'

/**
 * Global rate limiter middleware using express-rate-limit.
 */
const rateLimiter = rateLimit({
  windowMs: env.COMMON_RATE_LIMIT_WINDOW_MS * 60 * 1000, // e.g., 15 minutes
  limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS, // e.g., 100 requests
  standardHeaders: true, // Sends `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers (if preferred)

  /**
   * Generates a unique key for each client based on IP.
   */
  keyGenerator: (req) => req.ip || '',

  /**
   * Structured response when rate limit is exceeded.
   */
  handler: (_req, res) => {
    const response = ServiceResponse.createFailure(
      'Too many requests. Please try again later.',
      undefined,
      StatusCodes.TOO_MANY_REQUESTS
    )
    response.send(res) // Sends the rate-limited response via ServiceResponse
  }
})

export default rateLimiter
