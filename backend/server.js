import app from './src/app.js'
import { env } from './src/config/env.js'
import { initializeDatabase } from './src/config/initDb.js'
import logger from './src/config/logger.js'

const start = async () => {
  try {
    const tables = await initializeDatabase()
    logger.info('Tables ready:', tables.join(', '))

    app.listen(env.port, () => {
      logger.info(`Roys Hotel API running on port ${env.port} [${env.nodeEnv}]`)
      logger.info(`Health check: http://localhost:${env.port}/api/health`)
    })
  } catch (err) {
    logger.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
