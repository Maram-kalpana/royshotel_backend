import { query, getConnection } from '../config/db.js'
import { generateId, getMonthYearLabel } from '../utils/helpers.js'

const mapTenant = (row, paymentHistory = []) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  roomNumber: row.room_number,
  bedId: row.bed_id,
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
    const [history] = await query(
      'SELECT * FROM monthly_payments WHERE tenant_id = ? ORDER BY due_date DESC',
      [row.id],
    )
    return mapTenant(row, history)
  }))
}

export const createTenant = async (data) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const [beds] = await conn.execute('SELECT * FROM beds WHERE id = ? FOR UPDATE', [data.bedId])
    const bed = beds[0]
    if (!bed || bed.status !== 'vacant') {
      throw Object.assign(new Error('Selected bed is not available'), { status: 400 })
    }

    const customerId = generateId('cust')
    const tenantId = generateId('mp')
    const customerName = data.customerName || data.name
    const checkInDate = (data.checkInDateTime || '').split('T')[0] || new Date().toISOString().split('T')[0]
    const monthlyRent = Number(data.monthlyRent) || 0
    const advancePaid = Number(data.advancePaid) || 0
    const dueDay = Number(data.dueDay) || 1

    if (!customerName || !monthlyRent) {
      throw Object.assign(new Error('Customer name and monthly rent are required'), { status: 400 })
    }

    await conn.execute(
      `INSERT INTO customers (id, name, phone, email, address, city, state, aadhaar, pan,
        photo_url, aadhaar_doc_url, pan_doc_url, status, room_id, bed_id, room_number, bed_number,
        floor_number, check_in_date, check_in_datetime, stay_type, security_deposit, monthly_rent, due_day, joining_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customerId, customerName, data.phone, data.email || null, data.address, data.city, data.state,
        data.aadhaar, data.pan, data.photo || null, data.aadhaarDoc || null, data.panDoc || null,
        'checked-in', bed.room_id, bed.id, bed.room_number, bed.bed_number, bed.floor_number,
        checkInDate, data.checkInDateTime || null, 'Monthly', advancePaid, monthlyRent, dueDay, checkInDate,
      ],
    )

    await conn.execute(
      `INSERT INTO monthly_tenants (id, customer_id, customer_name, room_number, bed_id, monthly_rent, due_day, status, booking_id)
       VALUES (?,?,?,?,?,?,?,?, NULL)`,
      [tenantId, customerId, customerName, bed.room_number, data.bedId, monthlyRent, dueDay, 'pending'],
    )

    const monthLabel = getMonthYearLabel()
    const dueDateObj = new Date()
    dueDateObj.setDate(dueDay)
    const dueDate = dueDateObj.toISOString().split('T')[0]
    const paymentId = generateId('mpay')
    const paymentStatus = advancePaid >= monthlyRent && advancePaid > 0 ? 'paid' : 'pending'

    await conn.execute(
      `INSERT INTO monthly_payments (id, tenant_id, customer_id, room_number, month_label, monthly_rent, due_date, amount_paid, payment_mode, payment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId, tenantId, customerId, bed.room_number, monthLabel, monthlyRent, dueDate,
        advancePaid, advancePaid > 0 ? (data.paymentType || 'Cash') : null,
        advancePaid > 0 ? (data.paymentDate || checkInDate) : null,
        paymentStatus,
      ],
    )

    if (paymentStatus === 'paid') {
      await conn.execute(
        'UPDATE monthly_tenants SET last_paid_month=?, status="paid" WHERE id=?',
        [monthLabel, tenantId],
      )
    }

    await conn.execute('UPDATE beds SET status="occupied", customer_id=? WHERE id=?', [customerId, bed.id])

    await conn.commit()

    const [tenantRows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
    const [historyRows] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ?', [tenantId])
    return mapTenant(tenantRows[0], historyRows)
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
    `UPDATE monthly_payments SET amount_paid=?, payment_date=?, payment_mode=?, status='paid'
     WHERE tenant_id=? AND month_label=?`,
    [amount, paid, paymentMode || 'Cash', tenantId, month],
  )
  await query('UPDATE monthly_tenants SET last_paid_month=?, status="paid" WHERE id=?', [month, tenantId])
  const [tenantRows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
  const [historyRows] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ?', [tenantId])
  return mapTenant(tenantRows[0], historyRows)
}

export const deleteTenant = async (tenantId) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()
    const [tenants] = await conn.execute('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
    const tenant = tenants[0]
    if (!tenant) throw Object.assign(new Error('Tenant not found'), { status: 404 })

    if (tenant.bed_id) {
      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [tenant.bed_id])
    }
    if (tenant.customer_id) {
      await conn.execute(
        'UPDATE customers SET status="checked-out", check_out_date=?, check_out_datetime=NOW() WHERE id=?',
        [new Date().toISOString().split('T')[0], tenant.customer_id],
      )
    }
    await conn.execute('DELETE FROM monthly_tenants WHERE id = ?', [tenantId])
    await conn.commit()
    return true
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const listPending = async () => listTenants({ status: 'pending' })
export const listPaid = async () => listTenants({ status: 'paid' })

export const updateTenant = async (id, data) => {
  const [existingRows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [id])
  const existing = existingRows[0]
  if (!existing) throw Object.assign(new Error('Tenant not found'), { status: 404 })

  if (existing.customer_id && (data.name || data.phone)) {
    await query(
      `UPDATE customers SET name=?, phone=?, address=?, city=?, state=?, aadhaar=?, pan=?, monthly_rent=?, due_day=?
       WHERE id=?`,
      [
        data.name || data.customerName || existing.customer_name,
        data.phone,
        data.address,
        data.city,
        data.state,
        data.aadhaar,
        data.pan,
        data.monthlyRent ?? existing.monthly_rent,
        data.dueDay ?? existing.due_day,
        existing.customer_id,
      ],
    )
  }

  await query(
    `UPDATE monthly_tenants SET customer_name=?, room_number=?, monthly_rent=?, due_day=? WHERE id=?`,
    [
      data.customerName || data.name || existing.customer_name,
      data.roomNumber ?? existing.room_number,
      data.monthlyRent ?? existing.monthly_rent,
      data.dueDay ?? existing.due_day,
      id,
    ],
  )

  const [tenantRows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [id])
  const [historyRows] = await query('SELECT * FROM monthly_payments WHERE tenant_id = ?', [id])
  return mapTenant(tenantRows[0], historyRows)
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
