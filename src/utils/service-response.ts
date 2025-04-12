import { StatusCodes } from 'http-status-codes'
import { pino } from 'pino'
import pretty from 'pino-pretty'

// Create a pretty stream
const stream = pretty({ colorize: true })

// Create a logger instance that pipes to the pretty stream
const logger = pino(
  {
    name: 'musa-server',
    level: 'debug' // Change to debug to capture all logs
  },
  stream
)
/**
 * ServiceResponse class encapsulates the structure of a typical response for services in an API.
 * It includes success status, message, and the HTTP status code.
 */
export class ServiceResponse {
  // Whether the response is successful or not
  readonly success: boolean
  // A message that provides more details about the response
  readonly message: string
  // HTTP status code for the response
  readonly statusCode: number

  // Private constructor to ensure instantiation via the static methods
  private constructor(
    success: boolean,
    message: string,
    statusCode: number
  ) {
    this.success = success
    this.message = message
    this.statusCode = statusCode
  }

  /**
   * Factory method to create a successful response.
   * @param message - The success message.
   * @param statusCode - The HTTP status code (default is 200 OK).
   * @returns An instance of the ServiceResponse with success status.
   */
  static success(
    message: string,
    statusCode: number = StatusCodes.OK
  ): ServiceResponse {
    logger.info(
      {
        message,
        statusCode,
        success: true
      },
      'Response sent successfully'
    ) // Professional structured log
    return new ServiceResponse(true, message, statusCode)
  }

  /**
   * Factory method to create a failure response.
   * @param message - The failure message.
   * @param statusCode - The HTTP status code (default is 400 BAD REQUEST).
   * @returns An instance of the ServiceResponse with failure status.
   */
  static failure(
    message: string,
    statusCode: number = StatusCodes.BAD_REQUEST
  ): ServiceResponse {
    logger.error(
      {
        message,
        statusCode,
        success: false
      },
      'Response failed'
    ) // Professional structured log
    return new ServiceResponse(false, message, statusCode)
  }
}
