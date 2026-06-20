import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin, superAdminOnly } from '../middleware/role.js'
import * as dashboardController from '../controllers/dashboardController.js'

const router = Router()

router.use(authenticate, anyAdmin)
router.get('/stats', dashboardController.stats)
router.get('/monthly-payments/stats', dashboardController.monthlyStats)
router.get('/vacancy/stats', dashboardController.vacancyStats)

export default router
