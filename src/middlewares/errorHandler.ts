import type { Request, Response } from 'express'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import sendResponse from './sendResponse.js'

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

export const errorHandler = (
  err: ErrorHandler,
  req: Request,
  res: Response
) => {
  const statusCode = err.status || StatusCodes.INTERNAL_SERVER_ERROR
  const message = err.message || getReasonPhrase(statusCode)

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  const responseObject = {
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    path: req.originalUrl,
    method: req.method
  }

  sendResponse(res, false, message, responseObject, statusCode)
}
