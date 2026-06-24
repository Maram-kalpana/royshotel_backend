import { query, getConnection } from '../config/db.js'
import { generateId } from '../utils/helpers.js'

const mapRoom = (row) => ({
  id: row.id,
  floorId: row.floor_id,
  floorNumber: row.floor_number,
  roomNumber: row.room_number,
  roomType: row.room_type,
  bedType: row.bed_type,
  acType: row.ac_type,
  totalBeds: row.total_beds,
  costOfBed: Number(row.cost_per_bed),
  status: row.status,
  description: row.description,
})

const mapBed = (row) => ({
  id: row.id,
  bedNumber: row.bed_number,
  roomId: row.room_id,
  roomNumber: row.room_number,
  floorId: row.floor_id,
  floorNumber: row.floor_number,
  cost: Number(row.cost),
  status: row.status,
  customerId: row.customer_id,
  bedType: row.bed_type,
})

const mapBedForRoom = (row) => ({
  id: row.id,
  bedNumber: row.bed_number,
  bedType: row.bed_type,
  cost: Number(row.cost),
})

const normalizeBeds = (data) => {
  if (Array.isArray(data.beds) && data.beds.length > 0) {
    return data.beds.map((bed, index) => ({
      id: bed.id || null,
      bedNumber: Number(bed.bedNumber) || index + 1,
      bedType: bed.bedType || 'Single',
      cost: Number(bed.cost) || 0,
      status: bed.status || 'vacant',
    }))
  }
  const bedCount = Number(data.numberOfBeds) || 1
  return Array.from({ length: bedCount }, (_, i) => ({
    id: null,
    bedNumber: i + 1,
    bedType: data.bedType || 'Single',
    cost: Number(data.costOfBed) || 0,
    status: 'vacant',
  }))
}

const duplicateRoomError = (floorNumber, roomNumber) =>
  Object.assign(new Error(`Room ${roomNumber} already exists on Floor ${floorNumber}`), { status: 409 })

export const listRooms = async ({ search, floorNumber } = {}) => {
  let sql = 'SELECT r.* FROM rooms r WHERE 1=1'
  const params = []
  if (floorNumber) { sql += ' AND r.floor_number = ?'; params.push(floorNumber) }
  if (search) { sql += ' AND (r.room_number LIKE ? OR CAST(r.floor_number AS CHAR) LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
  sql += ' ORDER BY r.floor_number, r.room_number'

  const [rows] = await query(sql, params)
  return rows.map(mapRoom)
}

export const listBeds = async ({ status, floorNumber, roomNumber } = {}) => {
  let sql = 'SELECT * FROM beds WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (floorNumber) { sql += ' AND floor_number = ?'; params.push(floorNumber) }
  if (roomNumber) { sql += ' AND room_number LIKE ?'; params.push(`%${roomNumber}%`) }
  sql += ' ORDER BY floor_number, room_number, bed_number'
  const [rows] = await query(sql, params)
  return rows.map(mapBed)
}

export const createRoom = async (data) => {
  const [existing] = await query(
    'SELECT id FROM rooms WHERE floor_number = ? AND room_number = ? LIMIT 1',
    [data.floorNumber, data.roomNumber],
  )
  if (existing[0]) throw duplicateRoomError(data.floorNumber, data.roomNumber)

  const beds = normalizeBeds(data)
  const avgCost = beds.reduce((sum, b) => sum + b.cost, 0) / beds.length
  const primaryBedType = beds[0]?.bedType || data.bedType || 'Single'

  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    let floorId = data.floorId
    if (!floorId) {
      const [floors] = await conn.execute('SELECT id FROM floors WHERE number = ? LIMIT 1', [data.floorNumber])
      if (floors[0]) floorId = floors[0].id
      else {
        floorId = generateId('floor')
        await conn.execute(
          'INSERT INTO floors (id, name, number, total_rooms) VALUES (?, ?, ?, 1)',
          [floorId, `Floor ${data.floorNumber}`, data.floorNumber],
        )
      }
    }

    const roomId = generateId('room')
    await conn.execute(
      `INSERT INTO rooms (id, floor_id, floor_number, room_number, room_type, bed_type, ac_type, total_beds, cost_per_bed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId, floorId, data.floorNumber, data.roomNumber,
        primaryBedType, primaryBedType, data.acType || 'Non A/C', beds.length, avgCost,
      ],
    )

    for (const bed of beds) {
      const bedId = generateId('bed')
      await conn.execute(
        `INSERT INTO beds (id, room_id, room_number, floor_id, floor_number, bed_number, bed_type, cost, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bedId, roomId, data.roomNumber, floorId, data.floorNumber,
          bed.bedNumber, bed.bedType, bed.cost, bed.status || 'vacant',
        ],
      )
    }

    await conn.commit()
    return getRoomById(roomId)
  } catch (err) {
    await conn.rollback()
    if (err.code === 'ER_DUP_ENTRY') throw duplicateRoomError(data.floorNumber, data.roomNumber)
    throw err
  } finally {
    conn.release()
  }
}

export const updateRoom = async (id, data) => {
  const [currentRows] = await query('SELECT * FROM rooms WHERE id = ?', [id])
  const current = currentRows[0]
  if (!current) throw Object.assign(new Error('Room not found'), { status: 404 })

  const floorNumber = data.floorNumber ?? current.floor_number
  const roomNumber = data.roomNumber ?? current.room_number

  const [conflict] = await query(
    'SELECT id FROM rooms WHERE floor_number = ? AND room_number = ? AND id != ? LIMIT 1',
    [floorNumber, roomNumber, id],
  )
  if (conflict[0]) throw duplicateRoomError(floorNumber, roomNumber)

  const beds = normalizeBeds(data)
  const avgCost = beds.reduce((sum, b) => sum + b.cost, 0) / beds.length
  const primaryBedType = beds[0]?.bedType || data.bedType || current.bed_type

  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    let floorId = current.floor_id
    const [floors] = await conn.execute('SELECT id FROM floors WHERE number = ? LIMIT 1', [floorNumber])
    if (floors[0]) floorId = floors[0].id

    await conn.execute(
      `UPDATE rooms SET floor_id=?, floor_number=?, room_number=?, room_type=?, bed_type=?, ac_type=?, cost_per_bed=?, total_beds=?
       WHERE id=?`,
      [floorId, floorNumber, roomNumber, primaryBedType, primaryBedType, data.acType || current.ac_type, avgCost, beds.length, id],
    )

    const [existingBeds] = await conn.execute('SELECT * FROM beds WHERE room_id = ?', [id])
    const incomingIds = new Set(beds.filter((b) => b.id).map((b) => b.id))

    for (const existing of existingBeds) {
      if (!incomingIds.has(existing.id)) {
        if (existing.status === 'occupied') {
          throw Object.assign(new Error(`Cannot remove occupied Bed ${existing.bed_number}`), { status: 400 })
        }
        await conn.execute('DELETE FROM beds WHERE id = ?', [existing.id])
      }
    }

    for (const bed of beds) {
      if (bed.id) {
        const existing = existingBeds.find((b) => b.id === bed.id)
        const status = bed.status || existing?.status || 'vacant'
        await conn.execute(
          `UPDATE beds SET bed_number=?, bed_type=?, cost=?, status=?, room_number=?, floor_id=?, floor_number=?
           WHERE id=? AND room_id=?`,
          [bed.bedNumber, bed.bedType, bed.cost, status, roomNumber, floorId, floorNumber, bed.id, id],
        )
      } else {
        const bedId = generateId('bed')
        await conn.execute(
          `INSERT INTO beds (id, room_id, room_number, floor_id, floor_number, bed_number, bed_type, cost, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [bedId, id, roomNumber, floorId, floorNumber, bed.bedNumber, bed.bedType, bed.cost, bed.status || 'vacant'],
        )
      }
    }

    await conn.commit()
    return getRoomById(id)
  } catch (err) {
    await conn.rollback()
    if (err.code === 'ER_DUP_ENTRY') throw duplicateRoomError(floorNumber, roomNumber)
    throw err
  } finally {
    conn.release()
  }
}

export const deleteRoom = async (id) => {
  const [bedRows] = await query('SELECT * FROM beds WHERE room_id = ?', [id])
  const inUse = bedRows.some((b) => b.status === 'occupied' || b.customer_id)
  if (inUse) {
    throw Object.assign(new Error('Room is in use'), { status: 400 })
  }
  await query('DELETE FROM beds WHERE room_id = ?', [id])
  const [result] = await query('DELETE FROM rooms WHERE id = ?', [id])
  if (!result.affectedRows) {
    throw Object.assign(new Error('Room not found'), { status: 404 })
  }
  return true
}

export const deleteBed = async (bedId) => {
  const [rows] = await query('SELECT * FROM beds WHERE id = ?', [bedId])
  const bed = rows[0]
  if (!bed) {
    throw Object.assign(new Error('Bed not found'), { status: 404 })
  }
  if (bed.status === 'occupied' || bed.customer_id) {
    throw Object.assign(new Error('Bed is in use'), { status: 400 })
  }

  const roomId = bed.room_id
  await query('DELETE FROM beds WHERE id = ?', [bedId])

  const [remaining] = await query('SELECT COUNT(*) AS count FROM beds WHERE room_id = ?', [roomId])
  const count = Number(remaining[0]?.count || 0)

  if (count === 0) {
    await query('DELETE FROM rooms WHERE id = ?', [roomId])
  } else {
    const [costRows] = await query('SELECT AVG(cost) AS avgCost FROM beds WHERE room_id = ?', [roomId])
    await query(
      'UPDATE rooms SET total_beds = ?, cost_per_bed = ? WHERE id = ?',
      [count, Number(costRows[0]?.avgCost || 0), roomId],
    )
  }
  return true
}

export const getRoomById = async (id) => {
  const [rooms] = await query('SELECT * FROM rooms WHERE id = ?', [id])
  if (!rooms[0]) return null
  const [bedRows] = await query('SELECT * FROM beds WHERE room_id = ? ORDER BY bed_number', [id])
  const beds = bedRows.map(mapBedForRoom)
  return {
    ...mapRoom({ ...rooms[0], total_beds: beds.length }),
    beds,
  }
}

export { mapBed, mapRoom }
