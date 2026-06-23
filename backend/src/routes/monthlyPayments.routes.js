import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin } from '../middleware/role.js'
import * as monthlyController from '../controllers/monthlyController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/collection-summary', monthlyController.collectionSummary)
router.get('/export', monthlyController.exportCsv)
router.get('/pending', monthlyController.listPending)
router.get('/paid', monthlyController.listPaid)
router.get('/dues', monthlyController.listDues)
router.get('/:id', monthlyController.getById)
router.get('/', monthlyController.list)
router.post('/', monthlyController.create)
router.put('/:id', monthlyController.update)
router.put('/:id/add-payment', monthlyController.addPayment)
router.post('/:id/mark-paid', monthlyController.markPaid)
router.delete('/:id', monthlyController.remove)

export default router
