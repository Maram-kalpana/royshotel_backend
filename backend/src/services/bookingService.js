import { query, getConnection } from '../config/db.js'
import { generateId } from '../utils/helpers.js'

const toDateTimeOrNull = (value) => (value && value !== '' ? value : null)

const mapBooking = (row, payments = [], shifts = []) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  phone: row.phone,
  bedId: row.bed_id,
  roomId: row.room_id,
  roomNumber: row.room_number,
  bedNumber: row.bed_number,
  floorNumber: row.floor_number,
  stayType: row.stay_type,
  duration: row.duration,
  bedCost: Number(row.bed_cost),
  totalAmount: Number(row.total_amount),
  advancePaid: Number(row.advance_paid),
  balanceAmount: Number(row.balance_amount),
  securityDeposit: Number(row.security_deposit),
  monthlyRent: Number(row.monthly_rent),
  paymentType: row.payment_type,
  paymentStatus: row.payment_status,
  status: row.status,
  checkInDate: row.check_in_date,
  checkInDateTime: row.check_in_datetime,
  checkOutDateTime: row.check_out_datetime,
  extendedUpto: row.extended_upto,
  extendedAmount: Number(row.extended_amount),
  extendedStatus: row.extended_status,
  extendedPaymentType: row.extended_payment_type,
  extendedPaymentDate: row.extended_payment_date,
  createdAt: row.created_at,
  payments,
  shifts,
})

export const listBookings = async ({ status, search, checkInDate, paymentStatus, role } = {}) => {
  let sql = 'SELECT * FROM bookings WHERE 1=1'
  const params = []
  if (role === 'super_admin') sql += ' AND status IN ("active","reserved","booked")'
  sql += ' AND (stay_type IS NULL OR stay_type NOT IN ("Months", "Monthly"))'
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (checkInDate) { sql += ' AND check_in_date = ?'; params.push(checkInDate) }
  if (paymentStatus) { sql += ' AND payment_status = ?'; params.push(paymentStatus) }
  if (search) {
    sql += ' AND (customer_name LIKE ? OR phone LIKE ? OR room_number LIKE ?)'
    const q = `%${search}%`
    params.push(q, q, q)
  }
  sql += ' ORDER BY created_at DESC'
  const [rows] = await query(sql, params)
  return Promise.all(rows.map(async (row) => {
    const [payments] = await query('SELECT * FROM booking_payments WHERE booking_id = ?', [row.id])
    const [shifts] = await query('SELECT * FROM booking_shifts WHERE booking_id = ?', [row.id])
    return mapBooking(row, payments.map((p) => ({
      amount: Number(p.amount), date: p.payment_date, type: p.payment_type, status: p.status,
    })), shifts.map((s) => ({
      id: s.id,
      shiftType: s.shift_type,
      oldRoomNumber: s.old_room_number,
      oldBedNumber: s.old_bed_number,
      oldFloorNumber: s.old_floor_number,
      newRoomNumber: s.new_room_number,
      newBedNumber: s.new_bed_number,
      newFloorNumber: s.new_floor_number,
      shiftDate: s.shift_date,
    })))
  }))
}

export const createBooking = async (data) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const [beds] = await conn.execute('SELECT * FROM beds WHERE id = ? FOR UPDATE', [data.bedId])
    const bed = beds[0]
    if (!bed || bed.status !== 'vacant') throw Object.assign(new Error('Bed not available'), { status: 400 })

    const customerId = generateId('cust')
    const bookingId = generateId('booking')
    const checkInDate = (data.checkInDateTime || '').split('T')[0] || new Date().toISOString().split('T')[0]
    const advancePaid = Number(data.advancePaid || 0)
    const balance = Math.max(0, Number(data.totalAmount) - advancePaid)
    const paymentStatus = data.paymentStatus || (balance <= 0 ? 'completed' : 'pending')
    const primaryPaymentType = data.advancePaymentType || data.paymentType || 'Cash'

    await conn.execute(
      `INSERT INTO customers (id, name, phone, email, address, city, state, aadhaar, pan,
        photo_url, aadhaar_doc_url, pan_doc_url, status, room_id, bed_id, room_number, bed_number,
        floor_number, check_in_date, check_in_datetime, stay_type, security_deposit, monthly_rent, due_day, joining_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customerId, data.name, data.phone, data.email || null, data.address, data.city, data.state,
        data.aadhaar, data.pan, data.photo || null, data.aadhaarDoc || null, data.panDoc || null,
        'checked-in', bed.room_id, bed.id, bed.room_number, bed.bed_number, bed.floor_number,
        checkInDate, data.checkInDateTime, data.stayType, 0, Number(data.monthlyRent || 0), data.dueDay || null, checkInDate,
      ],
    )

    await conn.execute(
      `INSERT INTO bookings (id,customer_id,customer_name,phone,bed_id,room_id,room_number,bed_number,floor_number,stay_type,duration,bed_cost,total_amount,advance_paid,balance_amount,payment_type,payment_status,status,check_in_date,check_in_datetime,check_out_datetime)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        bookingId, customerId, data.name, data.phone, bed.id, bed.room_id, bed.room_number, bed.bed_number,
        bed.floor_number, data.stayType, data.duration || 1, data.bedCost || 0, data.totalAmount, advancePaid,
        balance, primaryPaymentType, paymentStatus, 'active', checkInDate,
        data.checkInDateTime, data.checkOutDateTime || null,
      ],
    )

    if (advancePaid > 0) {
      await conn.execute(
        'INSERT INTO booking_payments (id, booking_id, amount, payment_date, payment_type, status) VALUES (?,?,?,?,?,?)',
        [
          generateId('pay'), bookingId, advancePaid,
          data.advancePaymentDate || data.checkInDateTime || new Date(),
          data.advancePaymentType || primaryPaymentType,
          'completed',
        ],
      )
    }

    if (balance > 0 && data.balancePaymentDate) {
      await conn.execute(
        'INSERT INTO booking_payments (id, booking_id, amount, payment_date, payment_type, status) VALUES (?,?,?,?,?,?)',
        [
          generateId('pay'), bookingId, balance,
          data.balancePaymentDate,
          data.balancePaymentType || data.paymentType || 'Cash',
          paymentStatus === 'completed' ? 'completed' : 'pending',
        ],
      )
    }

    await conn.execute('UPDATE beds SET status="occupied", customer_id=? WHERE id=?', [customerId, bed.id])
    await conn.commit()

    const [rows] = await query('SELECT * FROM bookings WHERE id = ?', [bookingId])
    return mapBooking(rows[0])
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const updateBooking = async (id, data) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const [bookings] = await conn.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [id])
    const booking = bookings[0]
    if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 })

    const balancePaymentAmount = Number(data.balancePaymentAmount || 0)
    const balance = data.balanceAmount != null
      ? Number(data.balanceAmount)
      : Math.max(0, Number(data.totalAmount) - Number(data.advancePaid || 0))
    const isCheckout = Boolean(toDateTimeOrNull(data.checkOutDateTime))
      && ['checked-out', 'completed'].includes(data.status || booking.status)

    if (isCheckout && balance > 0) {
      throw Object.assign(
        new Error(`Cannot checkout while balance of ₹${balance} is pending`),
        { status: 400 },
      )
    }

    let bedId = booking.bed_id
    let roomId = booking.room_id
    let roomNumber = booking.room_number
    let bedNumber = booking.bed_number
    let floorNumber = booking.floor_number

    if (data.newBedId && data.newBedId !== booking.bed_id) {
      const [newBeds] = await conn.execute('SELECT * FROM beds WHERE id = ? FOR UPDATE', [data.newBedId])
      const newBed = newBeds[0]
      if (!newBed || newBed.status !== 'vacant') {
        throw Object.assign(new Error('Selected bed is not available'), { status: 400 })
      }

      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [booking.bed_id])
      await conn.execute('UPDATE beds SET status="occupied", customer_id=? WHERE id=?', [booking.customer_id, newBed.id])

      bedId = newBed.id
      roomId = newBed.room_id
      roomNumber = newBed.room_number
      bedNumber = newBed.bed_number
      floorNumber = newBed.floor_number

      await conn.execute(
        `INSERT INTO booking_shifts (id, booking_id, shift_type, old_room_number, old_bed_number, old_floor_number,
          new_room_number, new_bed_number, new_floor_number, shift_date)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          generateId('shift'), id, 'Room Shift',
          booking.room_number, booking.bed_number, booking.floor_number,
          newBed.room_number, newBed.bed_number, newBed.floor_number,
          data.shiftDate || new Date().toISOString().split('T')[0],
        ],
      )
    }

    await conn.execute(
      `UPDATE bookings SET customer_name=?, phone=?, bed_id=?, room_id=?, room_number=?, bed_number=?, floor_number=?,
        total_amount=?, advance_paid=?, balance_amount=?, payment_type=?, payment_status=?, check_out_datetime=?,
        extended_upto=?, extended_amount=?, extended_status=?, extended_payment_type=?, extended_payment_date=?, status=?
       WHERE id=?`,
      [
        data.customerName || data.name,
        data.phone,
        bedId,
        roomId,
        roomNumber,
        bedNumber,
        floorNumber,
        data.totalAmount,
        data.advancePaid,
        balance,
        data.paymentType,
        data.paymentStatus,
        toDateTimeOrNull(data.checkOutDateTime),
        toDateTimeOrNull(data.extendedUpto),
        data.extendedAmount || 0,
        data.extendedStatus,
        data.extendedPaymentType,
        toDateTimeOrNull(data.extendedPaymentDate),
        data.status || booking.status,
        id,
      ],
    )

    if (data.balancePaymentDate && balancePaymentAmount > 0) {
      await conn.execute(
        'INSERT INTO booking_payments (id, booking_id, amount, payment_date, payment_type, status) VALUES (?,?,?,?,?,?)',
        [
          generateId('pay'), id, balancePaymentAmount, data.balancePaymentDate,
          data.balancePaymentType || data.paymentType || 'Cash',
          data.paymentStatus === 'completed' ? 'completed' : 'pending',
        ],
      )
    }

    if (isCheckout && bedId) {
      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [bedId])
      await conn.execute(
        'UPDATE customers SET status="checked-out", check_out_date=?, check_out_datetime=? WHERE id=?',
        [
          (data.checkOutDateTime || '').split('T')[0] || new Date().toISOString().split('T')[0],
          toDateTimeOrNull(data.checkOutDateTime),
          booking.customer_id,
        ],
      )
    }

    if (data.customerId && (data.name || data.customerName)) {
      await conn.execute(
        'UPDATE customers SET name=?, phone=?, address=?, city=?, state=?, aadhaar=?, pan=? WHERE id=?',
        [
          data.name || data.customerName,
          data.phone,
          data.address ?? null,
          data.city ?? null,
          data.state ?? null,
          data.aadhaar ?? null,
          data.pan ?? null,
          data.customerId,
        ],
      )

      if (data.newBedId && data.newBedId !== booking.bed_id) {
        await conn.execute(
          'UPDATE customers SET room_id=?, bed_id=?, room_number=?, bed_number=?, floor_number=? WHERE id=?',
          [roomId, bedId, roomNumber, bedNumber, floorNumber, data.customerId],
        )
      }
    }

    await conn.commit()
    const [rows] = await query('SELECT * FROM bookings WHERE id = ?', [id])
    return mapBooking(rows[0])
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export const deleteBooking = async (id) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()
    const [bookings] = await conn.execute('SELECT * FROM bookings WHERE id = ?', [id])
    const booking = bookings[0]
    if (booking?.bed_id) {
      await conn.execute('UPDATE beds SET status="vacant", customer_id=NULL WHERE id=?', [booking.bed_id])
    }
    if (booking?.customer_id) {
      await conn.execute('UPDATE customers SET status="checked-out" WHERE id=?', [booking.customer_id])
    }
    await conn.execute('DELETE FROM bookings WHERE id = ?', [id])
    await conn.commit()
    return true
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export { mapBooking }
