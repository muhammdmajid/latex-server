import { ServiceResponse } from '@/utils/service-response.js'
import type { Response } from 'express'

/**
 * Helper function to log and send structured responses.
 * @param res - The Express Response object
 * @param success - Success status (true or false)
 * @param message - The response message
 * @param responseObject - The data or details of the response
 * @param statusCode - The HTTP status code
 */
export default function sendResponse(
  res: Response,
  success: boolean,
  message: string,
  responseObject: any,
  statusCode: number
) {
  const response = success
    ? ServiceResponse.success(message, statusCode)
    : ServiceResponse.failure(message, statusCode)

  res.status(response.statusCode).json({
    success: response.success,
    message: response.message,
    data: responseObject
  })
}
