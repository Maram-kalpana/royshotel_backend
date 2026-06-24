import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as roomController from '../controllers/roomController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/', roomController.listBeds)
router.get('/vacant', (req, res, next) => {
  req.query.status = 'vacant'
  roomController.listBeds(req, res, next)
})
router.delete('/:id', roomController.deleteBed)

export default router
