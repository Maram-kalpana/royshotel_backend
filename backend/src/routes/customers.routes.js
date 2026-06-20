import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as customerController from '../controllers/customerController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', customerController.list)
router.get('/:id', customerController.getOne)
router.post('/', customerController.create)
router.put('/:id', customerController.update)
router.delete('/:id', customerController.remove)
router.post('/:id/checkout', customerController.checkout)

export default router
