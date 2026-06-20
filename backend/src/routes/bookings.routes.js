import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as bookingController from '../controllers/bookingController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', bookingController.list)
router.post('/', bookingController.create)
router.put('/:id', bookingController.update)
router.delete('/:id', bookingController.remove)

export default router
