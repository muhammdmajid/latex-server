import express from 'express'
import { logger } from '../utils/service-response.js' // Make sure to import your logger

const siteRouter = express.Router()

/**
 * GET / 
 * Latex-IT server status check with error handling
 */
siteRouter.get('/', async (_req, res, next) => {
  try {
    // Log the incoming request
    logger.info('Received request to check server status')

    // Simulate status check or any logic
    res.status(200).send('✅ Latex-IT server is up and running!')

    // Log the successful response
    logger.info('Server is up and running, response sent')
  } catch (error) {
    // Log the error
    logger.error('Error in GET / route:', error)

    // Passes error to Express error handler middleware
    next(error)
  }
})

export default siteRouter
