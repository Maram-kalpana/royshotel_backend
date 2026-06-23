import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import { env } from './env.js'
import logger from './logger.js'
import { runMigrations } from './runMigrations.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const INDEX_DEFINITIONS = [
  ['beds', 'idx_beds_status', 'status'],
  ['customers', 'idx_customers_status', 'status'],
  ['bookings', 'idx_bookings_status', 'status'],
  ['bookings', 'idx_bookings_check_in', 'check_in_date'],
  ['expenses', 'idx_expenses_date', 'expense_date'],
  ['monthly_payments', 'idx_monthly_payments_status', 'status'],
  ['monthly_payments', 'idx_monthly_payments_due', 'due_date'],
]

const getTableCount = async (conn, dbName) => {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = ?`,
    [dbName],
  )
  return Number(rows[0].count)
}

const indexExists = async (conn, dbName, tableName, indexName) => {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.statistics
     WHERE table_schema = ? AND table_name = ? AND index_name = ?`,
    [dbName, tableName, indexName],
  )
  return Number(rows[0].count) > 0
}

export const ensureIndexes = async (conn, dbName) => {
  for (const [table, indexName, columns] of INDEX_DEFINITIONS) {
    const exists = await indexExists(conn, dbName, table, indexName)
    if (exists) {
      logger.info(`Index already exists, skipping: ${indexName}`)
      continue
    }
    logger.info(`Creating index: ${indexName}`)
    await conn.query(`CREATE INDEX ${indexName} ON ${table}(${columns})`)
  }
}

const seedDefaultAdmins = async (conn) => {
  const [admins] = await conn.query('SELECT COUNT(*) AS count FROM admins')
  if (Number(admins[0].count) > 0) return

  const superHash = await bcrypt.hash('SuperAdmin@123', 12)
  const adminHash = await bcrypt.hash('Admin@123', 12)
  await conn.query(
    `INSERT INTO admins (id, role_id, username, password_hash, name, email) VALUES
      ('super-admin-1', 1, 'superadmin', ?, 'Super Admin', 'superadmin@hotel.com'),
      ('admin-1', 2, 'admin', ?, 'Hotel Admin', 'admin@hotel.com')`,
    [superHash, adminHash],
  )
  logger.info('Default admin accounts seeded')
}

export const initializeDatabase = async () => {
  console.log('initializeDatabase called')
  logger.info('initializeDatabase called')

  const schemaPath = path.join(__dirname, '../../database/schema.sql')
  const dbName = env.db.database

  const bootstrap = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  })

  try {
    const tableCount = await getTableCount(bootstrap, dbName)

    if (tableCount > 0) {
      console.log('schema execution skipped')
      logger.info(`schema execution skipped (${tableCount} tables already exist in ${dbName})`)
    } else {
      console.log('schema execution started')
      logger.info('schema execution started')
      const schema = fs.readFileSync(schemaPath, 'utf8')
      await bootstrap.query(schema)
      console.log('schema execution completed')
      logger.info('schema execution completed')
    }

    await bootstrap.query(`USE \`${dbName}\``)
    await runMigrations(bootstrap, dbName, logger)
    await ensureIndexes(bootstrap, dbName)
    await seedDefaultAdmins(bootstrap)
  } finally {
    await bootstrap.end()
  }

  const pool = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: dbName,
  })

  try {
    const [tables] = await pool.query('SHOW TABLES')
    logger.info(`Database connected: ${dbName} (${tables.length} tables)`)
    return tables.map((t) => Object.values(t)[0])
  } finally {
    await pool.end()
  }
}
