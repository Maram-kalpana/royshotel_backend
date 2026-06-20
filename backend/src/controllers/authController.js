import * as authService from '../services/authService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body
  const result = await authService.loginAdmin(username, password)
  if (!result) return res.status(401).json({ success: false, message: 'Invalid credentials' })
  success(res, result)
})

export const me = asyncHandler(async (req, res) => {
  const admin = await authService.getAdminById(req.user.id)
  if (!admin) return res.status(404).json({ success: false, message: 'User not found' })
  success(res, admin)
})

export const logout = asyncHandler(async (_req, res) => {
  success(res, { message: 'Logged out' })
})

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerAdmin(req.body)
  success(res, result, 201)
})
