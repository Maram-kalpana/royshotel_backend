import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as settingsController from '../controllers/settingsController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', settingsController.get)
router.put('/', settingsController.update)

export default router
