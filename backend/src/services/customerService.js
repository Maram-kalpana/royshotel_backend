import { query, getConnection } from '../config/db.js'
import { generateId } from '../utils/helpers.js'

const mapCustomer = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  city: row.city,
  state: row.state,
  aadhaar: row.aadhaar,
  pan: row.pan,
  photo: row.photo_url,
  aadhaarDoc: row.aadhaar_doc_url,
  aadhaarFront: row.aadhaar_front_url || row.aadhaar_doc_url,
  aadhaarBack: row.aadhaar_back_url,
  panDoc: row.pan_doc_url,
  status: row.status,
  roomId: row.room_id,
  bedId: row.bed_id,
  roomNumber: row.room_number,
  bedNumber: row.bed_number,
  floorNumber: row.floor_number,
  checkInDate: row.check_in_date,
  checkInDateTime: row.check_in_datetime,
  checkOutDate: row.check_out_date,
  checkOutDateTime: row.check_out_datetime,
  stayType: row.stay_type,
  securityDeposit: Number(row.security_deposit),
  monthlyRent: Number(row.monthly_rent),
  dueDay: row.due_day,
  joiningDate: row.joining_date,
})

export const listCustomers = async ({ status, search, checkInDate } = {}) => {
  let sql = 'SELECT * FROM customers WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (checkInDate) { sql += ' AND check_in_date = ?'; params.push(checkInDate) }
  if (search) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR room_number LIKE ?)'
    const q = `%${search}%`
    params.push(q, q, q)
  }
  sql += ' ORDER BY created_at DESC'
  const [rows] = await query(sql, params)
  return rows.map(mapCustomer)
}

export const getCustomerById = async (id) => {
  const [rows] = await query('SELECT * FROM customers WHERE id = ?', [id])
  return rows[0] ? mapCustomer(rows[0]) : null
}

export const createCustomer = async (data) => {
  const id = data.id || generateId('cust')
  await query(
    `INSERT INTO customers (id, name, phone, email, address, city, state, aadhaar, pan,
      photo_url, aadhaar_doc_url, aadhaar_front_url, aadhaar_back_url, pan_doc_url, status, room_id, bed_id, room_number, bed_number,
      floor_number, check_in_date, check_in_datetime, stay_type, security_deposit, monthly_rent, due_day, joining_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.name, data.phone, data.email || null, data.address, data.city, data.state,
      data.aadhaar, data.pan, data.photo || null, data.aadhaarDoc || null,
      data.aadhaarFront || data.aadhaarDoc || null, data.aadhaarBack || null, data.panDoc || null,
      data.status || 'checked-in', data.roomId || null, data.bedId || null, data.roomNumber || null,
      data.bedNumber || null, data.floorNumber || null, data.checkInDate || null, data.checkInDateTime || null,
      data.stayType || null, data.securityDeposit || 0, data.monthlyRent || 0, data.dueDay || null,
      data.joiningDate || data.checkInDate || null,
    ],
  )
  return getCustomerById(id)
}

export const updateCustomer = async (id, data) => {
  await query(
    `UPDATE customers SET name=?, phone=?, email=?, address=?, city=?, state=?, aadhaar=?, pan=?,
      photo_url=?, aadhaar_doc_url=?, aadhaar_front_url=?, aadhaar_back_url=?, pan_doc_url=?,
      room_id=?, bed_id=?, room_number=?, bed_number=?,
      floor_number=?, check_in_date=?, check_in_datetime=?, stay_type=?, security_deposit=?, monthly_rent=?, due_day=?
     WHERE id=?`,
    [
      data.name, data.phone, data.email, data.address, data.city, data.state, data.aadhaar, data.pan,
      data.photo ?? null, data.aadhaarDoc ?? null, data.aadhaarFront ?? null, data.aadhaarBack ?? null,
      data.panDoc ?? null, data.roomId, data.bedId, data.roomNumber, data.bedNumber,
      data.floorNumber, data.checkInDate, data.checkInDateTime, data.stayType, data.securityDeposit || 0,
      data.monthlyRent || 0, data.dueDay, id,
    ],
  )
  return getCustomerById(id)
}

export const checkoutCustomer = async (customerId) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()
    const [customers] = await conn.execute('SELECT * FROM customers WHERE id = ? FOR UPDATE', [customerId])
    const customer = customers[0]
    if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 })
    if (customer.status === 'checked-out') {
      throw Object.assign(new Error('Customer is already checked out'), { status: 400 })
    }

    const [bookings] = await conn.execute(
      'SELECT * FROM bookings WHERE customer_id = ? AND status IN ("active","booked","reserved") ORDER BY created_at DESC LIMIT 1',
      [customerId],
    )
    const booking = bookings[0]
    if (booking && Number(booking.balance_amount) > 0) {
      throw Object.assign(new Error('Cannot checkout with pending balance'), { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    await conn.execute(
      'UPDATE customers SET status="checked-out", check_out_date=?, check_out_datetime=NOW() WHERE id=?',
      [today, customerId],
    )

    if (booking) {
      await conn.execute(
        'UPDATE bookings SET status="completed", balance_amount=0, check_out_datetime=COALESCE(check_out_datetime, NOW()) WHERE id=?',
        [booking.id],
      )
    }

    const [tenants] = await conn.execute(
      'SELECT * FROM monthly_tenants WHERE customer_id = ? LIMIT 1',
      [customerId],
    )
    const tenant = tenants[0]
    if (tenant) {
      await conn.execute(
        'UPDATE customers SET check_out_datetime=COALESCE(check_out_datetime, NOW()) WHERE id=?',
        [customerId],
      )
    }

    if (customer.bed_id) {
      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [customer.bed_id])
    }

    await conn.commit()
    return getCustomerById(customerId)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const deleteCustomer = async (id) => {
  const [result] = await query('DELETE FROM customers WHERE id = ?', [id])
  return result.affectedRows > 0
}

export { mapCustomer }
