import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { errorHandler } from './middlewares/errorHandler.js'
import rateLimiter from './middlewares/rateLimiter.js'
import requestLogger from './middlewares/requestLogger.js'
import { StatusCodes } from 'http-status-codes'
import sendResponse from './middlewares/sendResponse.js'
import siteRoot from './routes/index.js' // Importing API routes
import latexRoot from './routes/latex.js'
import { logger } from './utils/service-response.js'

// Resolve the filename and directory name to enable path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize the Express application
const app = express()

// Middleware to parse incoming JSON and URL-encoded payloads
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware for handling cookies in the requests
app.use(cookieParser())

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to log every request URL and method
app.use((req, res, next) => {
  logger.info(`Request Method: ${req.method} | Request URL: ${req.originalUrl}`);
  next(); // Proceed to the next middleware or route handler
});

// Use the API routes
app.use('/api', siteRoot);
app.use('/api/latex', latexRoot);




// Custom 404 handler for undefined routes
app.use((req, res) => {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
  sendResponse(
    res,
    false,
    'Route not found',
    { url: fullUrl },
    StatusCodes.NOT_FOUND
  )
})

// Apply rate limiting middleware to prevent abuse
app.use(rateLimiter)

// Request logging middleware to log incoming HTTP requests
app.use(requestLogger)

// Global error handler for catching and handling application errors
app.use(errorHandler)

// Export the app instance for use in other parts of the application
export default app
