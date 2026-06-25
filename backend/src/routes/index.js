import { Router } from 'express'
import authRoutes from './auth.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import accountsRoutes from './accounts.routes.js'
import floorsRoutes from './floors.routes.js'
import roomsRoutes from './rooms.routes.js'
import bedsRoutes from './beds.routes.js'
import customersRoutes from './customers.routes.js'
import bookingsRoutes from './bookings.routes.js'
import monthlyPaymentsRoutes from './monthlyPayments.routes.js'
import expensesRoutes from './expenses.routes.js'
import settingsRoutes from './settings.routes.js'
import uploadsRoutes from './uploads.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Roys Hotel API is running', timestamp: new Date().toISOString() })
})

router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/accounts', accountsRoutes)
router.use('/floors', floorsRoutes)
router.use('/rooms', roomsRoutes)
router.use('/beds', bedsRoutes)
router.use('/customers', customersRoutes)
router.use('/bookings', bookingsRoutes)
router.use('/monthly-payments', monthlyPaymentsRoutes)
router.use('/expenses', expensesRoutes)
router.use('/settings', settingsRoutes)
router.use('/uploads', uploadsRoutes)

export default router
