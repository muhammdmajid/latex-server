import { StatusCodes } from 'http-status-codes'
import { pino } from 'pino'

// Determine environment
const isDev = process.env.NODE_ENV !== 'production'

// Initialize logger
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: isDev,
      translateTime: 'SYS:standard'
    }
  },
  name: 'musa-server',
  level: isDev ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime
})

/**
 * Generic ServiceResponse class for API responses
 */
export default class ServiceResponse {
  constructor(success, message, statusCode, data) {
    this.success = success
    this.message = message
    this.statusCode = statusCode
    if (data !== undefined) {
      this.data = data
    }
  }

  static createSuccess(message, data, statusCode = StatusCodes.OK) {
    logger.info(
      {
        success: true,
        message,
        statusCode,
        data
      },
      '✅ Response sent successfully'
    )
    return new ServiceResponse(true, message, statusCode, data)
  }

  static createFailure(message, error, statusCode = StatusCodes.BAD_REQUEST) {
    logger.error(
      {
        success: false,
        message,
        statusCode,
        error: error?.stack
      },
      '❌ Response failed'
    )
    return new ServiceResponse(false, message, statusCode)
  }

  /**
   * Send the response via Express
   * @param {import('express').Response} res
   */
  send(res) {
    res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data ?? undefined
    })
  }
}
