import { randomUUID } from 'node:crypto'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import { pinoHttp } from 'pino-http'
import env from './../config/config.js'
import sendResponse from './sendResponse.js'

// Custom attribute keys for logs
const customAttributeKeys = {
  req: 'request',
  res: 'response',
  err: 'error',
  responseTime: 'timeTaken'
}

// Attach custom data to logs
const customProps = (req, res) => ({
  request: req,
  response: res,
  error: res.locals?.err,
  responseBody: res.locals?.responseBody
})

// Middleware to capture and log response body
const responseBodyMiddleware = (_req, res, next) => {
  if (!env.isProduction) {
    const originalSend = res.send.bind(res)
    res.send = (body) => {
      res.locals.responseBody = body

      const isSuccess = res.statusCode < StatusCodes.BAD_REQUEST
      const message = getReasonPhrase(res.statusCode)

      sendResponse(res, isSuccess, message, body, res.statusCode)

      return originalSend(body)
    }
  }
  next()
}

// Determine log level based on status or error
const customLogLevel = (_req, res, err) => {
  if (err || res.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) return 'error'
  if (res.statusCode >= StatusCodes.BAD_REQUEST) return 'warn'
  if (res.statusCode >= StatusCodes.MULTIPLE_CHOICES) return 'silent'
  return 'info'
}

// Log message on success
const customSuccessMessage = (req, res) => {
  return res.statusCode === StatusCodes.NOT_FOUND
    ? getReasonPhrase(StatusCodes.NOT_FOUND)
    : `${req.method} completed`
}

// Generate request ID
const genReqId = (req, res) => {
  const existingID = req.id ?? req.headers['x-request-id']
  if (existingID && typeof existingID === 'string') return existingID

  const id = randomUUID()
  res.setHeader('X-Request-Id', id)
  return id
}

// Combine response logger and pino logger
const requestLogger = (options = {}) => {
  const pinoOptions = {
    enabled: env.isProduction,
    customProps,
    customAttributeKeys,
    customLogLevel,
    customSuccessMessage,
    customReceivedMessage: (req) => `Request received: ${req.method}`,
    customErrorMessage: (_req, res) =>
      `Request errored with status code: ${res.statusCode}`,
    genReqId,
    redact: [],
    ...options
  }

  return [responseBodyMiddleware, pinoHttp(pinoOptions)]
}

export default requestLogger()
