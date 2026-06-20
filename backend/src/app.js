import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import logger from './config/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.set('trust proxy', 1)

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
  credentials: true,
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}))

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`)
  next()
})

app.use('/uploads', express.static(path.join(__dirname, '../', env.uploadDir)))
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
