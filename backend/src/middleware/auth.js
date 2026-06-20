import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const signToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn })

export const verifyToken = (token) =>
  jwt.verify(token, env.jwt.secret)

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    const token = header.slice(7)
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      req.user = verifyToken(header.slice(7))
    }
  } catch {
    // ignore
  }
  next()
}
