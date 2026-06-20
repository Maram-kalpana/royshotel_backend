import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as roomController from '../controllers/roomController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', roomController.listRooms)
router.get('/:id', roomController.getOne)
router.post('/', roomController.createRoom)
router.put('/:id', roomController.updateRoom)
router.delete('/:id', roomController.deleteRoom)

export default router
