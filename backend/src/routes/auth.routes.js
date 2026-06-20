import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/errorHandler.js'
import { authenticate } from '../middleware/auth.js'
import * as authController from '../controllers/authController.js'

const router = Router()

router.post('/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
  validate,
], authController.login)

router.post('/register', [
  body('username').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  validate,
], authController.register)

router.get('/me', authenticate, authController.me)
router.post('/logout', authenticate, authController.logout)

export default router
