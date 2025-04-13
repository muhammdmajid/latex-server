import type { Request, Response, } from 'express'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import sendResponse from './sendResponse.js'

/**
 * Custom application error handler class.
 */
export class ErrorHandler extends Error {
  status: number

  constructor(
    message: string,
    status: number = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    super(message)
    this.status = status
    this.name = 'ErrorHandler'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Global Express error-handling middleware.
 */
export const errorHandler = (
  err: Error | ErrorHandler,
  req: Request,
  res: Response): void => {
  // Determine status code from ErrorHandler or default to INTERNAL_SERVER_ERROR
  const statusCode =
    err instanceof ErrorHandler ? err.status : StatusCodes.INTERNAL_SERVER_ERROR

  // If no message provided, use reason phrase for the status code
  const message = err.message || getReasonPhrase(statusCode)

  // Construct response object
  const responseObject = {
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    path: req.originalUrl,
    method: req.method
  }

  // Send response using sendResponse utility function
  sendResponse(
    res,
    false,
    message,
    responseObject,
    statusCode,
    err // for logging stack trace
  )
}
