import { ServiceResponse } from '@/utils/service-response.js'
import type { Response } from 'express'

/**
 * Helper function to log and send structured responses.
 * @param res - The Express Response object
 * @param success - Success status (true or false)
 * @param message - The response message
 * @param data - The payload or error details
 * @param statusCode - The HTTP status code
 * @param error - Optional Error object for logging
 */
export default function sendResponse<T>(
  res: Response,
  success: boolean,
  message: string,
  data?: T,
  statusCode: number = 200,
  error?: Error
): void {
  const response = success
    ? ServiceResponse.createSuccess<T>(message, data, statusCode)
    : ServiceResponse.createFailure<T>(message, error, statusCode)

  res.status(response.statusCode).json({
    success: response.success,
    message: response.message,
    data: response.data ?? null
  })
}
