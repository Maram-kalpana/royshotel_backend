import { query } from '../config/db.js'

export const getSettings = async () => {
  const [rows] = await query('SELECT * FROM settings WHERE id = 1')
  const s = rows[0] || {}
  return {
    hotelName: s.hotel_name,
    address: s.address,
    phone: s.phone,
    email: s.email,
    gstNumber: s.gst_number,
  }
}

export const updateSettings = async (data) => {
  await query(
    'UPDATE settings SET hotel_name=?, address=?, phone=?, email=?, gst_number=? WHERE id=1',
    [data.hotelName, data.address, data.phone, data.email, data.gstNumber],
  )
  return getSettings()
}
