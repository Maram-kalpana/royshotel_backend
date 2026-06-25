import { query } from '../config/db.js'

const mapFloor = (row) => ({
  id: row.id,
  name: row.name,
  number: row.number,
  totalRooms: row.total_rooms,
  description: row.description,
})

export const listFloors = async () => {
  const [rows] = await query('SELECT * FROM floors ORDER BY number')
  return rows.map(mapFloor)
}

export { mapFloor }
