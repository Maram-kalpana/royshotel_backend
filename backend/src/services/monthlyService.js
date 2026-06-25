import { query, getConnection } from '../config/db.js'
import { generateId, getMonthYearLabel } from '../utils/helpers.js'
import {
  computePaymentStatus,
  validateSplitPayments,
  parseMonthYear,
} from '../utils/monthlyPaymentUtils.js'

const mapSplit = (row) => ({
  id: row.id,
  amount: Number(row.amount),
  paymentMode: row.payment_mode,
  transactionId: row.transaction_id || '',
  paymentDate: row.payment_date,
  notes: row.notes || '',
})

const isAdvanceOnlySplit = (splits) =>
  splits.length > 0 && splits.every((s) => (s.notes || '').toLowerCase().includes('advance'))

const resolveLastPaidRentMonth = (paymentHistory, splitsByPayment = {}) => {
  for (const p of paymentHistory) {
    const splits = splitsByPayment[p.id] || []
    if (isAdvanceOnlySplit(splits)) continue
    const rent = Number(p.monthly_rent)
    const paid = Number(p.amount_paid ?? 0)
    if (p.status === 'paid' && paid >= rent) {
      return p.month_label
    }
  }
  return null
}

const mapPaymentRecord = (row, splits = []) => {
  const totalRent = Number(row.monthly_rent)
  const totalPaid = Number(row.amount_paid ?? 0)
  const balanceAmount = Math.max(0, totalRent - totalPaid)
  const { month, year } = parseMonthYear(row.month_label)

  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    bookingId: row.booking_id,
    roomNumber: row.room_number,
    month: row.month_label,
    monthNum: month,
    year,
    totalRent,
    totalPaid,
    balanceAmount,
    paymentStatus: row.status || computePaymentStatus(totalRent, totalPaid),
    dueDate: row.due_date,
    paidDate: row.payment_date,
    payments: splits.map(mapSplit),
  }
}

const mapTenant = (row, paymentHistory = [], splitsByPayment = {}) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  phone: row.phone || '',
  roomNumber: row.room_number,
  bedId: row.bed_id,
  monthlyRent: Number(row.monthly_rent),
  dueDay: row.due_day,
  lastPaidMonth: resolveLastPaidRentMonth(paymentHistory, splitsByPayment),
  status: row.status,
  paymentHistory: paymentHistory
    .filter((p) => {
      const splits = splitsByPayment[p.id] || []
      if (isAdvanceOnlySplit(splits)) return false
      return Number(p.amount_paid ?? 0) > 0 || splits.length > 0
    })
    .map((p) => mapPaymentRecord(p, splitsByPayment[p.id] || [])),
})

const loadSplitsForPayments = async (paymentIds) => {
  if (!paymentIds.length) return {}
  const placeholders = paymentIds.map(() => '?').join(',')
  const [rows] = await query(
    `SELECT * FROM monthly_payment_splits WHERE monthly_payment_id IN (${placeholders}) ORDER BY payment_date, created_at`,
    paymentIds,
  )
  return rows.reduce((acc, row) => {
    const pid = row.monthly_payment_id
    if (!acc[pid]) acc[pid] = []
    acc[pid].push(row)
    return acc
  }, {})
}

const loadTenantHistory = async (tenantId) => {
  const [history] = await query(
    'SELECT * FROM monthly_payments WHERE tenant_id = ? ORDER BY due_date DESC',
    [tenantId],
  )
  const splitsByPayment = await loadSplitsForPayments(history.map((h) => h.id))
  return { history, splitsByPayment }
}

const syncTenantStatus = async (tenantId) => {
  const [history] = await query(
    'SELECT * FROM monthly_payments WHERE tenant_id = ? ORDER BY due_date DESC',
    [tenantId],
  )
  const [tenantRows] = await query('SELECT * FROM monthly_tenants WHERE id = ?', [tenantId])
  if (!tenantRows[0]) return

  const hasPartial = history.some((r) => r.status === 'partial')
  const hasPending = history.some((r) => r.status === 'pending')

  let status = 'paid'
  if (hasPartial) status = 'partial'
  else if (hasPending) status = 'pending'

  const splitsByPayment = await loadSplitsForPayments(history.map((h) => h.id))
  const lastPaidMonth = resolveLastPaidRentMonth(history, splitsByPayment)

  await query(
    'UPDATE monthly_tenants SET status=?, last_paid_month=? WHERE id=?',
    [status, lastPaidMonth, tenantId],
  )
}

export const listTenants = async ({ status } = {}) => {
  let sql = `SELECT t.*, c.phone FROM monthly_tenants t
    LEFT JOIN customers c ON c.id = t.customer_id WHERE 1=1`
  const params = []
  if (status) { sql += ' AND t.status = ?'; params.push(status) }
  sql += ' ORDER BY t.customer_name'
  const [rows] = await query(sql, params)

  return Promise.all(rows.map(async (row) => {
    const { history, splitsByPayment } = await loadTenantHistory(row.id)
    return mapTenant(row, history, splitsByPayment)
  }))
}

export const getTenant = async (tenantId) => {
  const [rows] = await query(
    `SELECT t.*, c.phone FROM monthly_tenants t
     LEFT JOIN customers c ON c.id = t.customer_id WHERE t.id = ?`,
    [tenantId],
  )
  if (!rows[0]) throw Object.assign(new Error('Tenant not found'), { status: 404 })
  const { history, splitsByPayment } = await loadTenantHistory(tenantId)
  return mapTenant(rows[0], history, splitsByPayment)
}

export const listDues = async ({ status, search } = {}) => {
  let sql = `
    SELECT mp.*, t.customer_name, t.monthly_rent AS tenant_rent, c.phone
    FROM monthly_payments mp
    JOIN monthly_tenants t ON t.id = mp.tenant_id
    LEFT JOIN customers c ON c.id = mp.customer_id
    WHERE 1=1`
  const params = []

  if (status) {
    sql += ' AND mp.status = ?'
    params.push(status)
  }

  if (search) {
    const q = `%${search}%`
    sql += ' AND (t.customer_name LIKE ? OR mp.room_number LIKE ? OR c.phone LIKE ?)'
    params.push(q, q, q)
  }

  sql += ' ORDER BY mp.due_date DESC, t.customer_name'

  const [rows] = await query(sql, params)
  const splitsByPayment = await loadSplitsForPayments(rows.map((r) => r.id))

  return rows.map((row) => ({
    ...mapPaymentRecord(row, splitsByPayment[row.id] || []),
    customerName: row.customer_name,
    phone: row.phone || '',
  }))
}

export const addSplitPayment = async (tenantId, { month, payments, paymentStatus: forcedStatus }) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const [tenants] = await conn.execute('SELECT * FROM monthly_tenants WHERE id = ? FOR UPDATE', [tenantId])
    const tenant = tenants[0]
    if (!tenant) throw Object.assign(new Error('Tenant not found'), { status: 404 })

    const monthLabel = month || getMonthYearLabel()
    const [existingRows] = await conn.execute(
      'SELECT * FROM monthly_payments WHERE tenant_id = ? AND month_label = ? FOR UPDATE',
      [tenantId, monthLabel],
    )

    let record = existingRows[0]
    const totalRent = Number(tenant.monthly_rent)

    if (!record) {
      const paymentId = generateId('mpay')
      const dueDateObj = new Date()
      dueDateObj.setDate(tenant.due_day || 1)
      const dueDate = dueDateObj.toISOString().split('T')[0]
      await conn.execute(
        `INSERT INTO monthly_payments (id, tenant_id, customer_id, booking_id, room_number, month_label, monthly_rent, due_date, amount_paid, pending_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending')`,
        [
          paymentId, tenantId, tenant.customer_id, tenant.booking_id,
          tenant.room_number, monthLabel, totalRent, dueDate, totalRent,
        ],
      )
      const [newRows] = await conn.execute(
        'SELECT * FROM monthly_payments WHERE id = ?',
        [paymentId],
      )
      record = newRows[0]
    }

    const currentPaid = Number(record.amount_paid ?? 0)
    const balanceRemaining = Math.max(0, totalRent - currentPaid)
    validateSplitPayments(payments, balanceRemaining)

    let batchTotal = 0
    let latestDate = record.payment_date

    for (const p of payments) {
      const amount = Number(p.amount)
      batchTotal += amount
      const payDate = p.paymentDate || new Date().toISOString().split('T')[0]
      if (!latestDate || payDate > latestDate) latestDate = payDate

      await conn.execute(
        `INSERT INTO monthly_payment_splits (id, monthly_payment_id, amount, payment_mode, transaction_id, payment_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('split'), record.id, amount, p.paymentMode || 'Cash',
          p.transactionId || null, payDate, p.notes || null,
        ],
      )
    }

    const newTotalPaid = currentPaid + batchTotal
    const newBalance = Math.max(0, totalRent - newTotalPaid)
    const computedStatus = computePaymentStatus(totalRent, newTotalPaid)
    const newStatus = forcedStatus === 'paid'
      ? 'paid'
      : forcedStatus === 'pending'
        ? (newTotalPaid > 0 ? 'partial' : 'pending')
        : computedStatus

    await conn.execute(
      `UPDATE monthly_payments SET amount_paid=?, pending_amount=?, status=?, payment_date=?, payment_mode=?
       WHERE id=?`,
      [newTotalPaid, newBalance, newStatus, latestDate, payments[payments.length - 1]?.paymentMode || 'Cash', record.id],
    )

    if (newStatus === 'paid') {
      await conn.execute(
        'UPDATE monthly_tenants SET last_paid_month=?, status="paid" WHERE id=?',
        [monthLabel, tenantId],
      )
    } else if (newStatus === 'partial') {
      await conn.execute('UPDATE monthly_tenants SET status="partial" WHERE id=?', [tenantId])
    } else {
      await conn.execute('UPDATE monthly_tenants SET status="pending" WHERE id=?', [tenantId])
    }

    await conn.commit()
    return getTenant(tenantId)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

/** @deprecated — use addSplitPayment */
export const markTenantPaid = async (tenantId, body) => {
  if (body.payments?.length) {
    return addSplitPayment(tenantId, { month: body.month, payments: body.payments })
  }
  return addSplitPayment(tenantId, {
    month: body.month,
    payments: [{
      amount: body.amount,
      paymentMode: body.paymentMode || 'Cash',
      transactionId: body.transactionId,
      paymentDate: body.paidDate,
      notes: body.notes,
    }],
  })
}

export const getCollectionSummary = async ({ month, year } = {}) => {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  const monthLabel = new Date(targetYear, targetMonth - 1, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const [rentRows] = await query(
    'SELECT COUNT(*) AS tenants, COALESCE(SUM(monthly_rent), 0) AS expected FROM monthly_tenants',
  )
  const [monthRows] = await query(
    `SELECT
       COALESCE(SUM(monthly_rent), 0) AS expectedRent,
       COALESCE(SUM(amount_paid), 0) AS collectedRent,
       COALESCE(SUM(CASE WHEN status = 'pending' THEN pending_amount ELSE 0 END), 0) AS pendingAmount,
       COALESCE(SUM(CASE WHEN status = 'partial' THEN pending_amount ELSE 0 END), 0) AS partialAmount
     FROM monthly_payments WHERE month_label = ?`,
    [monthLabel],
  )
  const [bedRows] = await query(
    `SELECT
       COUNT(*) AS totalBeds,
       SUM(status = 'occupied') AS occupiedBeds,
       SUM(status = 'vacant') AS vacantBeds
     FROM beds`,
  )

  const expected = Number(monthRows[0]?.expectedRent) || Number(rentRows[0]?.expected) || 0
  const collected = Number(monthRows[0]?.collectedRent) || 0
  const totalBeds = Number(bedRows[0]?.totalBeds) || 0
  const occupied = Number(bedRows[0]?.occupiedBeds) || 0

  return {
    month: monthLabel,
    monthNum: targetMonth,
    year: targetYear,
    expectedRent: expected,
    collectedRent: collected,
    pendingAmount: Number(monthRows[0]?.pendingAmount) || 0,
    partialAmount: Number(monthRows[0]?.partialAmount) || 0,
    totalTenants: Number(rentRows[0]?.tenants) || 0,
    occupancy: totalBeds ? Math.round((occupied / totalBeds) * 100) : 0,
    occupiedBeds: occupied,
    vacantBeds: Number(bedRows[0]?.vacantBeds) || 0,
    totalBeds,
  }
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
        photo_url, aadhaar_doc_url, aadhaar_front_url, aadhaar_back_url, pan_doc_url, driving_license_url, notes,
        status, room_id, bed_id, room_number, bed_number, floor_number, check_in_date, check_in_datetime,
        stay_type, security_deposit, monthly_rent, due_day, joining_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customerId, customerName, data.phone, data.email || null, data.address, data.city, data.state,
        data.aadhaar, data.pan, data.photo || null, data.aadhaarDoc || null,
        data.aadhaarFront || data.aadhaarDoc || null, data.aadhaarBack || null,
        data.panDoc || null, data.drivingLicense || null, data.notes || null,
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

    await conn.execute(
      `INSERT INTO monthly_payments (id, tenant_id, customer_id, room_number, month_label, monthly_rent, due_date, amount_paid, pending_amount, payment_mode, payment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId, tenantId, customerId, bed.room_number, monthLabel, monthlyRent, dueDate,
        0, monthlyRent, null, null, 'pending',
      ],
    )

    await conn.execute('UPDATE beds SET status="occupied", customer_id=? WHERE id=?', [customerId, bed.id])
    await conn.commit()
    return getTenant(tenantId)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
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

export const listPending = async () => {
  await refreshPendingStatuses()
  return listDues({ status: 'pending' })
}

export const listPaid = async () => listDues({ status: 'paid' })

export const updateTenant = async (id, data) => {
  const nullish = (v) => (v === undefined ? null : v)
  const conn = await getConnection()

  try {
    await conn.beginTransaction()

    const [existingRows] = await conn.execute('SELECT * FROM monthly_tenants WHERE id = ? FOR UPDATE', [id])
    const existing = existingRows[0]
    if (!existing) throw Object.assign(new Error('Tenant not found'), { status: 404 })

    let bedId = existing.bed_id
    let roomNumber = data.roomNumber ?? existing.room_number

    if (data.newBedId && data.newBedId !== existing.bed_id) {
      const [newBeds] = await conn.execute('SELECT * FROM beds WHERE id = ? FOR UPDATE', [data.newBedId])
      const newBed = newBeds[0]
      if (!newBed || newBed.status !== 'vacant') {
        throw Object.assign(new Error('Selected bed is not available'), { status: 400 })
      }

      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [existing.bed_id])
      await conn.execute('UPDATE beds SET status="occupied", customer_id=? WHERE id=?', [existing.customer_id, newBed.id])

      bedId = newBed.id
      roomNumber = newBed.room_number

      await conn.execute(
        `UPDATE customers SET room_id=?, bed_id=?, room_number=?, bed_number=?, floor_number=? WHERE id=?`,
        [newBed.room_id, newBed.id, newBed.room_number, newBed.bed_number, newBed.floor_number, existing.customer_id],
      )
    }

    if (existing.customer_id) {
      await conn.execute(
        `UPDATE customers SET name=?, phone=?, address=?, city=?, state=?, aadhaar=?, pan=?,
          photo_url=COALESCE(?, photo_url), aadhaar_doc_url=COALESCE(?, aadhaar_doc_url),
          aadhaar_front_url=COALESCE(?, aadhaar_front_url), aadhaar_back_url=COALESCE(?, aadhaar_back_url),
          pan_doc_url=COALESCE(?, pan_doc_url), driving_license_url=COALESCE(?, driving_license_url),
          notes=COALESCE(?, notes), monthly_rent=?, due_day=?, security_deposit=COALESCE(?, security_deposit),
          check_out_datetime=COALESCE(?, check_out_datetime)
         WHERE id=?`,
        [
          nullish(data.name) || nullish(data.customerName) || existing.customer_name,
          nullish(data.phone),
          nullish(data.address),
          nullish(data.city),
          nullish(data.state),
          nullish(data.aadhaar),
          nullish(data.pan),
          nullish(data.photo),
          nullish(data.aadhaarDoc),
          nullish(data.aadhaarFront),
          nullish(data.aadhaarBack),
          nullish(data.panDoc),
          nullish(data.drivingLicense),
          nullish(data.notes),
          data.monthlyRent ?? existing.monthly_rent,
          data.dueDay ?? existing.due_day,
          data.advancePaid != null ? Number(data.advancePaid) : null,
          nullish(data.checkOutDateTime),
          existing.customer_id,
        ],
      )
    }

    await conn.execute(
      `UPDATE monthly_tenants SET customer_name=?, room_number=?, bed_id=?, monthly_rent=?, due_day=? WHERE id=?`,
      [
        data.customerName || data.name || existing.customer_name,
        roomNumber,
        bedId,
        data.monthlyRent ?? existing.monthly_rent,
        data.dueDay ?? existing.due_day,
        id,
      ],
    )

    const checkoutDt = data.checkOutDateTime && data.checkOutDateTime !== '' ? data.checkOutDateTime : null
    const isTenantCheckout = Boolean(checkoutDt)
    if (isTenantCheckout && existing.bed_id) {
      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [existing.bed_id])
      const checkoutDate = (checkoutDt || '').split('T')[0] || new Date().toISOString().split('T')[0]
      await conn.execute(
        'UPDATE customers SET status="checked-out", check_out_date=?, check_out_datetime=? WHERE id=?',
        [checkoutDate, checkoutDt, existing.customer_id],
      )
    }

    await conn.commit()
    return getTenant(id)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const refreshPendingStatuses = async () => {
  await query(`
    UPDATE monthly_payments
    SET status = CASE
      WHEN amount_paid >= monthly_rent THEN 'paid'
      WHEN amount_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    pending_amount = GREATEST(0, monthly_rent - amount_paid)
    WHERE due_date < CURRENT_DATE() AND status != 'paid'
  `)
}

export { mapTenant, mapPaymentRecord }
