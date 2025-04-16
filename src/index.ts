import app from './server.js'
import env from '@/config/config.js'
import logger from '@/utils/service-response.js'
import { Server } from 'http'

const { NODE_ENV, HOST, PORT } = env

// Start the HTTP server
const server: Server = app.listen(PORT, () => {
  logger.info(`✅ Server (${NODE_ENV}) started`)
  logger.info(`🌐 http://${HOST}:${PORT}`)
  logger.info(`🚀 Environment: ${NODE_ENV}`)

  // Send ready signal for Docker/PM2
  setTimeout(() => {
    if (typeof process.send === 'function') {
      process.send('ready')
    }
  }, 1000)
})

// Graceful shutdown handler
const shutdown = (): void => {
  logger.info('📦 Shutdown signal received. Closing server...')

  server.close(() => {
    logger.info('✅ Server closed cleanly.')
    process.exit(0)
  })

  // Force exit if takes too long
  setTimeout(() => {
    logger.error('❗ Shutdown timed out. Forcing exit.')
    process.exit(1)
  }, 10000).unref()
}

// Listen for termination signals
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
