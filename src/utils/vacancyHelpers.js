/** Normalize entity ids for reliable Set/Map lookups */
export const normId = (id) => (id == null || id === '' ? '' : String(id))

/** Robust vacant-bed detection — supports multiple backend formats */
export const isVacantBed = (bed) => {
  if (!bed) return false

  const status = String(bed?.status ?? '').toLowerCase()

  if (status === 'occupied' || status === 'reserved') return false
  if (bed?.occupied === true || bed?.isOccupied === true) return false
  if (bed?.vacant === false) return false
  if (bed?.customerId) return false

  return (
    status === 'vacant' ||
    status === 'available' ||
    status === '' ||
    bed?.occupied === false ||
    bed?.isOccupied === false ||
    bed?.vacant === true
  )
}

export const filterVacantBeds = (beds = []) => (beds || []).filter(isVacantBed)

/** Enrich bed records with room/floor data when API omits fields */
export function enrichBedsWithRooms(beds = [], rooms = []) {
  const roomById = new Map(rooms.map((r) => [normId(r.id), r]))
  const roomByNumber = new Map(
    rooms.filter((r) => r.roomNumber != null).map((r) => [String(r.roomNumber), r]),
  )

  return beds.map((bed) => {
    const room = roomById.get(normId(bed.roomId))
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
    const roomId = normId(bed.roomId)
    if (!roomId || byRoom.has(roomId)) return
    byRoom.set(roomId, {
      id: roomId,
      floorId: bed.floorId != null ? normId(bed.floorId) : '',
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
    const floorId = normId(bed.floorId) || (bed.floorNumber != null ? `floor-${bed.floorNumber}` : '')
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
    id: normId(bed.id),
    roomId: normId(bed.roomId),
    floorId: bed.floorId != null && bed.floorId !== '' ? normId(bed.floorId) : bed.floorId,
    roomNumber: bed.roomNumber,
    floorNumber: bed.floorNumber,
    status: String(rawStatus).toLowerCase() || (bed.customerId ? 'occupied' : 'vacant'),
    cost: Number(bed.cost) || 0,
  }
}

export function normalizeRoom(room) {
  if (!room) return room
  return {
    ...room,
    id: normId(room.id),
    floorId: room.floorId != null && room.floorId !== '' ? normId(room.floorId) : room.floorId,
    floorNumber: room.floorNumber,
    roomNumber: room.roomNumber,
  }
}

export function normalizeFloor(floor) {
  if (!floor) return floor
  return {
    ...floor,
    id: normId(floor.id),
    number: floor.number,
    name: floor.name || (floor.number != null ? `Floor ${floor.number}` : 'Floor'),
  }
}

function bedMatchesFloor(bed, floor, selectedFloorId) {
  if (normId(bed.floorId) === normId(selectedFloorId)) return true
  if (normId(floor?.id) === normId(selectedFloorId) && floor?.number != null
    && Number(bed.floorNumber) === Number(floor.number)) return true
  if (floor && bed.floorNumber != null && Number(bed.floorNumber) === Number(floor.number)) return true
  return false
}

function bedMatchesRoom(bed, room) {
  if (normId(bed.roomId) === normId(room.id)) return true
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
    const match = floorList.find(
      (f) => normId(f.id) === normId(bed.floorId)
        || (bed.floorNumber != null && Number(f.number) === Number(bed.floorNumber)),
    )
    const id = normId(match?.id || bed.floorId || (bed.floorNumber != null ? `floor-${bed.floorNumber}` : ''))
    if (!id) return
    const number = match?.number ?? bed.floorNumber
    const name = match?.name || (number != null ? `Floor ${number}` : id)
    byId.set(id, { id, name, number })
  })

  const result = [...byId.values()].sort((a, b) => Number(a.number) - Number(b.number))
  if (!result.length && enriched.length) {
    return buildFloorsFromBeds(enriched).map(normalizeFloor)
  }
  return result
}

export function getVacantRooms(rooms = [], vacantBeds = [], floors = [], selectedFloorId) {
  if (!selectedFloorId) return []

  const selectedFloor = floors.find((f) => normId(f.id) === normId(selectedFloorId))
  const vacant = filterVacantBeds(vacantBeds)
  const enriched = enrichBedsWithRooms(vacant, rooms)
  const vacantRoomIds = new Set(enriched.map((b) => normId(b.roomId)))

  const roomSource = (rooms?.length ? rooms : buildRoomsFromBeds(enriched)).map(normalizeRoom)

  return roomSource.filter((r) => {
    const hasVacantBed = enriched.some((b) => bedMatchesRoom(b, r))
    if (!hasVacantBed && !vacantRoomIds.has(normId(r.id))) return false

    if (normId(r.floorId) === normId(selectedFloorId)) return hasVacantBed
    if (selectedFloor && r.floorNumber != null && Number(r.floorNumber) === Number(selectedFloor.number)) {
      return hasVacantBed
    }
    return enriched.some(
      (b) => bedMatchesRoom(b, r) && bedMatchesFloor(b, selectedFloor, selectedFloorId),
    )
  })
}

export function getVacantBedsForRoom(vacantBeds = [], roomId, rooms = []) {
  if (!roomId) return []
  const vacant = filterVacantBeds(vacantBeds)
  const enriched = enrichBedsWithRooms(vacant, rooms)
  const room = rooms.find((r) => normId(r.id) === normId(roomId))

  return enriched.filter(
    (b) => normId(b.roomId) === normId(roomId)
      || (room && bedMatchesRoom(b, room)),
  )
}
