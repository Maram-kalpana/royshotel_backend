import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as floorController from '../controllers/floorController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', floorController.list)

export default router
