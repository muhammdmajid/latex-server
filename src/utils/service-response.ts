import { StatusCodes } from 'http-status-codes'
import { pino } from 'pino'
import { type Response } from 'express'

// Determine environment
const isDev = process.env.NODE_ENV !== 'production'

// Initialize logger
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: isDev,
      translateTime: 'SYS:standard',
    },
  },
  name: 'musa-server',
  level: isDev ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
})



/**
 * Generic ServiceResponse class for API responses
 */
export default class ServiceResponse<T = null> {
  readonly success: boolean
  readonly message: string
  readonly statusCode: number
  readonly data?: T

  private constructor(
    success: boolean,
    message: string,
    statusCode: number,
    data?: T
  ) {
    this.success = success
    this.message = message
    this.statusCode = statusCode
    this.data = data
  }

  static createSuccess<T>(
    message: string,
    data?: T,
    statusCode: number = StatusCodes.OK
  ): ServiceResponse<T> {
    logger.info(
      {
        success: true,
        message,
        statusCode,
        data,
      },
      '✅ Response sent successfully'
    )
    return new ServiceResponse<T>(true, message, statusCode, data)
  }

  static createFailure<T = null>(
    message: string,
    error?: Error,
    statusCode: number = StatusCodes.BAD_REQUEST
  ): ServiceResponse<T> {
    logger.error(
      {
        success: false,
        message,
        statusCode,
        error: error?.stack || undefined,
      },
      '❌ Response failed'
    )
    return new ServiceResponse<T>(false, message, statusCode)
  }

  /**
   * Send the response via Express
   * @param res - Express Response object
   */
  send(res: Response): void {
    res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data ?? undefined,
    })
  }
}
