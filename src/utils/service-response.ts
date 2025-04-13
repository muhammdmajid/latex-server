import { StatusCodes } from 'http-status-codes'
import { pino } from 'pino'
import pretty from 'pino-pretty'

// Determine environment
const isDev = process.env.NODE_ENV !== 'production'

// Configure logger stream
const stream = isDev ? pretty({ colorize: true }) : undefined

// Create logger
const logger = pino(
  {
    name: 'musa-server',
    level: isDev ? 'debug' : 'info',
    base: { pid: false },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  stream
)

export default logger

/**
 * Generic ServiceResponse class for API responses
 */
export class ServiceResponse<T = null> {
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

  /**
   * Factory method for success response
   * @param message - Success message
   * @param data - Optional payload
   * @param statusCode - HTTP status code (default: 200 OK)
   */
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
        data
      },
      'Response sent successfully'
    )
    return new ServiceResponse<T>(true, message, statusCode, data)
  }

  /**
   * Factory method for failure response
   * @param message - Error message
   * @param error - Optional Error object
   * @param statusCode - HTTP status code (default: 400 BAD REQUEST)
   */
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
        error: error?.stack || undefined
      },
      'Response failed'
    )
    return new ServiceResponse<T>(false, message, statusCode)
  }
}
