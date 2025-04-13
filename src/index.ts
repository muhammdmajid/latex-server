import app from './server.js'
import env from '@/config/config.js'

import pretty from 'pino-pretty'
import { pino } from 'pino'

// Determine environment
const isDev = env.NODE_ENV !== 'production'
// Configure logger stream
const stream = isDev ? pretty({ colorize: true }) : undefined
// Create a logger instance that pipes to the pretty stream
const logger = pino(
  {
    name: 'musa-server-start',
    level: isDev ? 'debug' : 'info',
    base: { pid: false },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  stream
)

const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env
  logger.info(`Server (${NODE_ENV}) started successfully!`)
  logger.info(`Running on: http://${HOST}:${PORT}`)
  logger.info(`Environment: ${NODE_ENV}`)
  logger.info(`Listening on: ${HOST}:${PORT}`)
})

const onCloseSignal = () => {
  logger.info('Received SIGINT or SIGTERM. Initiating graceful shutdown...')
  server.close(() => {
    logger.info('HTTP server has been successfully closed.')
    process.exit()
  })

  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcefully exiting...')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', onCloseSignal)
process.on('SIGTERM', onCloseSignal)
