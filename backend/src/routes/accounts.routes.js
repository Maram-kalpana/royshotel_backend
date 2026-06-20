import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { superAdminOnly } from '../middleware/role.js'
import * as dashboardController from '../controllers/dashboardController.js'

const router = Router()

router.use(authenticate, superAdminOnly)
router.get('/summary', dashboardController.accountsSummary)
router.get('/profit-loss', dashboardController.profitLoss)

export default router
