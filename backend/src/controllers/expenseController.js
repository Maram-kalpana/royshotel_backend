import * as expenseService from '../services/expenseService.js'
import { asyncHandler, success } from '../utils/helpers.js'

export const list = asyncHandler(async (req, res) => {
  const data = await expenseService.listExpenses(req.query)
  success(res, data)
})

export const getOne = asyncHandler(async (req, res) => {
  const data = await expenseService.getExpenseById(req.params.id)
  if (!data) return res.status(404).json({ success: false, message: 'Expense not found' })
  success(res, data)
})

export const create = asyncHandler(async (req, res) => {
  const data = await expenseService.createExpense(req.body, req.user.id)
  success(res, data, 201)
})

export const update = asyncHandler(async (req, res) => {
  const data = await expenseService.updateExpense(req.params.id, req.body)
  if (!data) return res.status(404).json({ success: false, message: 'Expense not found' })
  success(res, data)
})

export const remove = asyncHandler(async (req, res) => {
  const ok = await expenseService.deleteExpense(req.params.id)
  if (!ok) return res.status(404).json({ success: false, message: 'Expense not found' })
  success(res, { deleted: true })
})
