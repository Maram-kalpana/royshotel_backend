import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'

export const generateId = (prefix = '') => {
  const id = randomUUID()
  return prefix ? `${prefix}-${id.split('-')[0]}` : id
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const success = (res, data, status = 200) => {
  res.status(status).json({ success: true, data })
}

export const paginate = (items, page = 1, limit = 50) => {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

export const hashPassword = async (password) => bcrypt.hash(password, 12)

export const comparePassword = async (password, hash) => bcrypt.compare(password, hash)

export const mapExpenseToFrontend = (row) => ({
  id: row.id,
  type: row.category,
  date: row.expense_date instanceof Date
    ? row.expense_date.toISOString().split('T')[0]
    : row.expense_date,
  amount: Number(row.amount),
  description: row.notes || row.expense_name,
  receipt: row.receipt_url || null,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

export const mapExpenseFromFrontend = (body) => ({
  expense_name: body.type || body.expenseName || body.description || 'Expense',
  category: body.type || body.category || 'miscellaneous',
  amount: Number(body.amount),
  expense_date: body.date || body.expenseDate,
  notes: body.description || body.notes || '',
  receipt_url: body.receipt || body.receiptUrl || null,
})

export const getMonthYearLabel = (date = new Date()) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export const formatDateOnly = (d) => {
  if (!d) return null
  if (d instanceof Date) return d.toISOString().split('T')[0]
  return String(d).split('T')[0]
}
