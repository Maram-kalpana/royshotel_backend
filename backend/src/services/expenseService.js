import { query } from '../config/db.js'
import { generateId, mapExpenseFromFrontend, mapExpenseToFrontend } from '../utils/helpers.js'

export const listExpenses = async ({ date, search } = {}) => {
  let sql = 'SELECT * FROM expenses WHERE 1=1'
  const params = []

  if (date) {
    sql += ' AND expense_date = ?'
    params.push(date)
  }
  if (search) {
    sql += ' AND (category LIKE ? OR expense_name LIKE ? OR notes LIKE ?)'
    const q = `%${search}%`
    params.push(q, q, q)
  }
  sql += ' ORDER BY expense_date DESC, created_at DESC'

  const [rows] = await query(sql, params)
  return rows.map(mapExpenseToFrontend)
}

export const getExpenseById = async (id) => {
  const [rows] = await query('SELECT * FROM expenses WHERE id = ?', [id])
  return rows[0] ? mapExpenseToFrontend(rows[0]) : null
}

export const createExpense = async (body, createdBy) => {
  const data = mapExpenseFromFrontend(body)
  const id = generateId('exp')
  await query(
    `INSERT INTO expenses (id, expense_name, category, amount, expense_date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.expense_name, data.category, data.amount, data.expense_date, data.notes, createdBy],
  )
  return getExpenseById(id)
}

export const updateExpense = async (id, body) => {
  const data = mapExpenseFromFrontend(body)
  await query(
    `UPDATE expenses SET expense_name=?, category=?, amount=?, expense_date=?, notes=? WHERE id=?`,
    [data.expense_name, data.category, data.amount, data.expense_date, data.notes, id],
  )
  return getExpenseById(id)
}

export const deleteExpense = async (id) => {
  const [result] = await query('DELETE FROM expenses WHERE id = ?', [id])
  return result.affectedRows > 0
}

export const getTotalExpenses = async () => {
  const [rows] = await query('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses')
  return Number(rows[0].total)
}
