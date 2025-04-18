import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import ServiceResponse from './../utils/service-response.js'

/**
 * Custom application error handler class.
 */
export class ErrorHandler extends Error {
  status

  constructor(message, status = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message)
    this.status = status
    this.name = 'ErrorHandler'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Global Express error-handling middleware.
 */
export const errorHandler = (err, req, res) => {
  const statusCode =
    err instanceof ErrorHandler ? err.status : StatusCodes.INTERNAL_SERVER_ERROR

  const message = err.message || getReasonPhrase(statusCode)

  const errorInfo = {
    path: req.originalUrl,
    method: req.method
  }

  if (process.env.NODE_ENV === 'development') {
    errorInfo.stack = err.stack
  }

  ServiceResponse.createFailure(message, err, statusCode).send(res)
}
