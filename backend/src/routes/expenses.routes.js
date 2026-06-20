import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { anyAdmin, superAdminOnly } from '../middleware/role.js'
import { validate } from '../middleware/errorHandler.js'
import * as expenseController from '../controllers/expenseController.js'

const router = Router()

router.use(authenticate, anyAdmin)

router.get('/', expenseController.list)
router.get('/:id', expenseController.getOne)
router.post('/', [
  body('type').optional().trim(),
  body('amount').isNumeric(),
  body('date').notEmpty(),
  validate,
], expenseController.create)
router.put('/:id', expenseController.update)
router.delete('/:id', expenseController.remove)

export default router
