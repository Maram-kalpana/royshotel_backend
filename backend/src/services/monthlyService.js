import { query, getConnection } from '../config/db.js'
import { generateId, getMonthYearLabel } from '../utils/helpers.js'

const mapTenant = (row, paymentHistory = []) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  roomNumber: row.room_number,
  monthlyRent: Number(row.monthly_rent),
  dueDay: row.due_day,
  lastPaidMonth: row.last_paid_month,
  status: row.status,
  paymentHistory: paymentHistory.map((p) => ({
    id: p.id,
    month: p.month_label,
    amount: Number(p.monthly_rent),
    paidDate: p.payment_date,
    status: p.status,
    paymentMode: p.payment_mode,
  })),
})

export const listTenants = async ({ status } = {}) => {
  let sql = 'SELECT * FROM monthly_tenants WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY customer_name'
  const [rows] = await query(sql, params)
  return Promise.all(rows.map(async (row) => {
    const [history] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ? ORDER BY due_date DESC', [row.id])
    return mapTenant(row, history)
  }))
}

export const generateMonthlyPayment = async (tenantId, monthLabel, dueDate, rent) => {
  const id = generateId('mp')
  await query(
    `INSERT INTO monthly_payments (id, tenant_id, customer_id, room_number, month_label, monthly_rent, due_date, pending_amount, status)
     SELECT ?, t.id, t.customer_id, t.room_number, ?, ?, ?, ?, 'pending'
     FROM monthly_tenants t WHERE t.id = ?
     ON DUPLICATE KEY UPDATE id=id`,
    [id, monthLabel, rent, dueDate, rent, tenantId],
  )
}

export const createTenant = async (data) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()
    const tenantId = generateId('mp')
    const customerId = data.customerId || generateId('cust')

    // Customer + booking creation handled by caller or inline
    await conn.execute(
      `INSERT INTO monthly_tenants (id, customer_id, customer_name, room_number, bed_id, monthly_rent, due_day, status)
       VALUES (?,?,?,?,?,?,?, 'pending')`,
      [tenantId, customerId, data.customerName, data.roomNumber, data.bedId, data.monthlyRent, data.dueDay || 1],
    )

    const monthLabel = getMonthYearLabel()
    const dueDate = new Date()
    dueDate.setDate(data.dueDay || 1)
    await generateMonthlyPayment(tenantId, monthLabel, dueDate.toISOString().split('T')[0], data.monthlyRent)

    await conn.commit()
    const [rows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
    return mapTenant(rows[0])
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const markTenantPaid = async (tenantId, { month, amount, paymentMode, paidDate }) => {
  const paid = paidDate || new Date().toISOString().split('T')[0]
  await query(
    `UPDATE monthly_payments SET amount_paid=?, pending_amount=0, payment_date=?, payment_mode=?, status='paid'
     WHERE tenant_id=? AND month_label=?`,
    [amount, paid, paymentMode || 'Cash', tenantId, month],
  )
  await query('UPDATE monthly_tenants SET last_paid_month=?, status="paid" WHERE id=?', [month, tenantId])
  const [rows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
  const [history] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ?', [tenantId])
  return mapTenant(rows[0], history)
}

export const deleteTenant = async (tenantId) => {
  const [result] = await query('DELETE FROM monthly_tenants WHERE id = ?', [tenantId])
  return result.affectedRows > 0
}

export const listPending = async () => listTenants({ status: 'pending' })
export const listPaid = async () => listTenants({ status: 'paid' })

export const updateTenant = async (id, data) => {
  await query(
    `UPDATE monthly_tenants SET customer_name=?, room_number=?, monthly_rent=?, due_day=?, status=? WHERE id=?`,
    [data.customerName, data.roomNumber, data.monthlyRent, data.dueDay, data.status || 'pending', id],
  )
  const [rows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [id])
  const [history] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ?', [id])
  return mapTenant(rows[0], history)
}

export const refreshPendingStatuses = async () => {
  await query(`
    UPDATE monthly_payments SET status = 'pending'
    WHERE status != 'paid' AND due_date < CURRENT_DATE()
  `)
  await query(`
    UPDATE monthly_tenants t SET status = 'pending'
    WHERE EXISTS (
      SELECT 1 FROM monthly_payments mp
      WHERE mp.tenant_id = t.id AND mp.status IN ('pending','partial')
    )
  `)
}

export { mapTenant }
