import { query } from '../config/db.js'
import { comparePassword, hashPassword, generateId } from '../utils/helpers.js'
import { signToken } from '../middleware/auth.js'

export const loginAdmin = async (username, password) => {
  const [rows] = await query(
    `SELECT a.id, a.username, a.password_hash, a.name, a.email, r.slug AS role
     FROM admins a JOIN roles r ON r.id = a.role_id
     WHERE a.username = ? AND a.is_active = 1 LIMIT 1`,
    [username],
  )
  const admin = rows[0]
  if (!admin) return null

  const valid = await comparePassword(password, admin.password_hash)
  if (!valid) return null

  const user = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
  const token = signToken(user)
  return { token, user }
}

export const getAdminById = async (id) => {
  const [rows] = await query(
    `SELECT a.id, a.name, a.email, r.slug AS role
     FROM admins a JOIN roles r ON r.id = a.role_id
     WHERE a.id = ? LIMIT 1`,
    [id],
  )
  return rows[0] || null
}

export const registerAdmin = async ({ username, password, name, email, role = 'admin' }) => {
  const [existing] = await query('SELECT id FROM admins WHERE username = ?', [username])
  if (existing.length) throw Object.assign(new Error('Username already exists'), { status: 409 })

  const [roles] = await query('SELECT id FROM roles WHERE slug = ?', [role])
  const roleId = roles[0]?.id || 2
  const id = generateId('admin')
  const passwordHash = await hashPassword(password)

  await query(
    'INSERT INTO admins (id, role_id, username, password_hash, name, email) VALUES (?,?,?,?,?,?)',
    [id, roleId, username, passwordHash, name, email || `${username}@hotel.com`],
  )

  const user = { id, name, email: email || `${username}@hotel.com`, role }
  return { token: signToken(user), user }
}
