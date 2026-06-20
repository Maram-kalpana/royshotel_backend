import mysql from 'mysql2/promise'
import { env } from './env.js'

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: '+00:00',
})

export const query = (sql, params = []) => pool.execute(sql, params)

export const getConnection = () => pool.getConnection()

export default pool
