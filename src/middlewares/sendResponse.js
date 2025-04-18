import ServiceResponse from './../utils/service-response.js'

/**
 * Helper function to log and send structured responses.
 * @param res - The Express Response object
 * @param success - Success status (true or false)
 * @param message - The response message
 * @param data - The payload or error details
 * @param statusCode - The HTTP status code
 * @param error - Optional Error object for logging
 */
export default function sendResponse(
  res,
  success,
  message,
  data = undefined,
  statusCode = 200,
  error = undefined
) {
  const response = success
    ? ServiceResponse.createSuccess(message, data, statusCode)
    : ServiceResponse.createFailure(message, error, statusCode)

  // Send response using ServiceResponse's send method
  response.send(res)
}
