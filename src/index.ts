import app from './server.js'
import env from '@/config/config.js'
import logger from '@/utils/service-response.js'

const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env
  logger.info(`Server (${NODE_ENV}) started successfully!`)
  logger.info(`Running on: http://${HOST}:${PORT}`)
  logger.info(`Environment: ${NODE_ENV}`)
  logger.info(`Listening on: ${HOST}:${PORT}`)
  // simulate a ready application after 1 second
  setTimeout(function () {
    if (process?.send) {
      process.send('ready')
    } else {
      console.error('process.send is not available')
    }
  }, 1000)
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
