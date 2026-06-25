/** Normalize entity ids for reliable Set/Map lookups */
export const normId = (id) => (id == null || id === '' ? '' : String(id))

/**
 * Robust vacant-bed detection — supports multiple backend formats:
 *   status: 'vacant' | 'available'
 *   occupied: false
 *   isOccupied: false
 *   vacant: true
 *
 * Also guards against truthy-but-empty customerId values ('', '0', 0).
 */
export const isVacantBed = (bed) => {
  if (!bed) return false

  const status = String(bed.status ?? '').toLowerCase().trim()

  // Explicit non-vacant statuses → not vacant
  if (status === 'occupied' || status === 'reserved') return false
  if (bed.occupied === true || bed.isOccupied === true) return false
  if (bed.vacant === false) return false

  // customerId that is truthy AND meaningful (not '' or '0' or 0 or null)
  const cid = bed.customerId
  if (cid != null && cid !== '' && cid !== 0 && cid !== '0' && cid !== 'null' && cid !== 'undefined') {
    return false
  }

  return (
    status === 'vacant' ||
    status === 'available' ||
    status === '' ||
    bed.occupied === false ||
    bed.isOccupied === false ||
    bed.vacant === true
  )
}

export const filterVacantBeds = (beds = []) => (beds || []).filter(isVacantBed)

/** Enrich bed records with room/floor data when API omits fields */
export function enrichBedsWithRooms(beds = [], rooms = []) {
  const roomById = new Map(rooms.map((r) => [String(r.id), r]))
  const roomByNumber = new Map(
    rooms.filter((r) => r.roomNumber != null).map((r) => [String(r.roomNumber), r]),
  )

  return beds.map((bed) => {
    const room = roomById.get(String(bed.roomId))
      || (bed.roomNumber != null ? roomByNumber.get(String(bed.roomNumber)) : null)

    return {
      ...bed,
      roomId: bed.roomId ?? room?.id,
      roomNumber: bed.roomNumber ?? room?.roomNumber,
      floorId: bed.floorId ?? room?.floorId,
      floorNumber: bed.floorNumber ?? room?.floorNumber,
      status: bed.status || (bed.customerId ? 'occupied' : 'vacant'),
    }
  })
}

/** Build room list from bed records when rooms API/store is empty */
export function buildRoomsFromBeds(beds = []) {
  const byRoom = new Map()
  beds.forEach((bed) => {
    const roomId = bed.roomId != null ? String(bed.roomId) : ''
    if (!roomId || byRoom.has(roomId)) return
    byRoom.set(roomId, {
      id: roomId,
      floorId: bed.floorId != null ? String(bed.floorId) : '',
      floorNumber: bed.floorNumber,
      roomNumber: bed.roomNumber,
    })
  })
  return [...byRoom.values()]
}

/** Build floor list from bed records when floors API/store is empty */
export function buildFloorsFromBeds(beds = []) {
  const byFloor = new Map()
  beds.forEach((bed) => {
    const floorId = bed.floorId != null ? String(bed.floorId) : (bed.floorNumber != null ? `floor-${bed.floorNumber}` : '')
    if (!floorId || byFloor.has(floorId)) return
    byFloor.set(floorId, {
      id: floorId,
      name: bed.floorNumber != null ? `Floor ${bed.floorNumber}` : `Floor ${floorId}`,
      number: bed.floorNumber,
    })
  })
  return [...byFloor.values()].sort((a, b) => Number(a.number) - Number(b.number))
}

export function normalizeBed(bed, { assumeVacant = false } = {}) {
  if (!bed) return bed
  const rawStatus = bed.status ?? (assumeVacant && !bed.customerId ? 'vacant' : '')
  return {
    ...bed,
    id: String(bed.id),
    roomId: String(bed.roomId),
    floorId: bed.floorId != null && bed.floorId !== '' ? String(bed.floorId) : bed.floorId,
    roomNumber: bed.roomNumber,
    floorNumber: bed.floorNumber,
    status: String(rawStatus).toLowerCase().trim() || (bed.customerId ? 'occupied' : 'vacant'),
    cost: Number(bed.cost) || 0,
  }
}

export function normalizeRoom(room) {
  if (!room) return room
  return {
    ...room,
    id: String(room.id),
    floorId: room.floorId != null && room.floorId !== '' ? String(room.floorId) : room.floorId,
    floorNumber: room.floorNumber,
    roomNumber: room.roomNumber,
  }
}

export function normalizeFloor(floor) {
  if (!floor) return floor
  return {
    ...floor,
    id: String(floor.id),
    number: floor.number,
    name: floor.name || (floor.number != null ? `Floor ${floor.number}` : 'Floor'),
  }
}

function bedMatchesFloor(bed, floor, selectedFloorId) {
  const bedFloor = bed.floorId != null ? String(bed.floorId) : ''
  const selFloor = selectedFloorId != null ? String(selectedFloorId) : ''

  // Direct floorId match
  if (bedFloor && selFloor && bedFloor === selFloor) return true

  // Match via floor object's id or number
  if (floor) {
    const fid = floor.id != null ? String(floor.id) : ''
    const fnum = floor.number != null ? String(floor.number) : ''
    const bnum = bed.floorNumber != null ? String(bed.floorNumber) : ''

    if (fid && selFloor && fid === selFloor) {
      if (bedFloor && bedFloor === fid) return true
      if (bnum && fnum && bnum === fnum) return true
    }
  }

  // Fallback: bed floorNumber matches floor number (even without floor object)
  if (floor && bed.floorNumber != null && floor.number != null
    && String(bed.floorNumber) === String(floor.number)) return true

  return false
}

function bedMatchesRoom(bed, room) {
  // Direct roomId match
  const bid = bed.roomId != null ? String(bed.roomId) : ''
  const rid = room.id != null ? String(room.id) : ''
  if (bid && rid && bid === rid) return true

  // Fallback: roomNumber match
  if (bed.roomNumber != null && room.roomNumber != null
    && String(bed.roomNumber) === String(room.roomNumber)) return true
  return false
}

/** Resolve floors available for booking or tenant forms */
export function getVacantFloors(floors = [], vacantBeds = [], rooms = []) {
  const vacant = filterVacantBeds(vacantBeds)
  if (!vacant.length) return []

  const enriched = enrichBedsWithRooms(vacant, rooms)
  let floorList = (floors?.length ? floors : buildFloorsFromBeds(enriched)).map(normalizeFloor)
  if (!floorList.length) floorList = buildFloorsFromBeds(enriched).map(normalizeFloor)

  const byId = new Map()
  enriched.forEach((bed) => {
    const match = floorList.find((f) => {
      const fid = f.id != null ? String(f.id) : ''
      const fnum = f.number != null ? String(f.number) : ''
      
      const bid = bed.floorId != null ? String(bed.floorId) : ''
      const bnum = bed.floorNumber != null ? String(bed.floorNumber) : ''

      const idMatch = fid && bid && fid === bid
      const numMatch = fnum && bnum && fnum === bnum
      
      return idMatch || numMatch
    })

    const finalFloorId = match?.id ?? bed.floorId ?? (bed.floorNumber != null ? String(bed.floorNumber) : '')
    if (!finalFloorId) return

    const finalFloorNumber = match?.number ?? bed.floorNumber
    const finalFloorName = match?.name || (finalFloorNumber != null ? `Floor ${finalFloorNumber}` : `Floor ${finalFloorId}`)

    byId.set(String(finalFloorId), {
      id: String(finalFloorId),
      name: finalFloorName,
      number: finalFloorNumber,
      floorNumber: finalFloorNumber,
      floorId: String(finalFloorId)
    })
  })

  let result = [...byId.values()]
  if (!result.length && enriched.length) {
    result = buildFloorsFromBeds(enriched).map(normalizeFloor)
  }
  return result.sort((a, b) => Number(a.number) - Number(b.number))
}

export function getVacantRooms(rooms = [], vacantBeds = [], floors = [], selectedFloorId) {
  if (!selectedFloorId) return []

  const vacant = filterVacantBeds(vacantBeds)
  const enriched = enrichBedsWithRooms(vacant, rooms)
  
  const selectedFloor = floors.find((f) => {
    const fid = f.id != null ? String(f.id) : ''
    const fnum = f.number != null ? String(f.number) : ''
    return (fid && String(selectedFloorId) === fid) ||
           (fnum && String(selectedFloorId) === fnum)
  })

  let roomSource = (rooms?.length ? rooms : buildRoomsFromBeds(enriched)).map(normalizeRoom)
  if (!roomSource.length) roomSource = buildRoomsFromBeds(enriched).map(normalizeRoom)

  return roomSource.filter((r) => {
    const hasVacantBed = enriched.some((b) => bedMatchesRoom(b, r))
    if (!hasVacantBed) return false

    // Match room to selected floor via multiple strategies
    const rFloorId = r.floorId != null ? String(r.floorId) : ''
    const rFloorNumber = r.floorNumber != null ? String(r.floorNumber) : ''
    const selFloorId = String(selectedFloorId)
    const selFloorNumber = selectedFloor?.number != null ? String(selectedFloor.number) : ''

    if (rFloorId && rFloorId === selFloorId) return true
    if (rFloorNumber && selFloorNumber && rFloorNumber === selFloorNumber) return true
    if (rFloorNumber && rFloorNumber === selFloorId) return true

    // Fallback: check if any bed in this room belongs to the selected floor
    return enriched.some(
      (b) => bedMatchesRoom(b, r) && bedMatchesFloor(b, selectedFloor, selectedFloorId),
    )
  })
}

export function getVacantBedsForRoom(vacantBeds = [], roomId, rooms = []) {
  if (!roomId) return []
  const vacant = filterVacantBeds(vacantBeds)
  const enriched = enrichBedsWithRooms(vacant, rooms)
  const room = rooms.find((r) => {
    const rid = r.id != null ? String(r.id) : ''
    const rnum = r.roomNumber != null ? String(r.roomNumber) : ''
    return (rid && rid === String(roomId)) || (rnum && rnum === String(roomId))
  })

  return enriched.filter((b) => {
    const bid = b.roomId != null ? String(b.roomId) : ''
    const bnum = b.roomNumber != null ? String(b.roomNumber) : ''
    const rid = String(roomId)

    if (bid && bid === rid) return true
    if (room && bedMatchesRoom(b, room)) return true
    if (bnum && bnum === rid) return true
    return false
  })
}
