import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppDispatch, useHotel } from './useStore'
import { loadRooms } from '../services/dataService'
import { floorsApi, roomsApi, bedsApi } from '../services/endpoints'
import {
  normalizeBed,
  normalizeRoom,
  normalizeFloor,
  buildRoomsFromBeds,
  buildFloorsFromBeds,
  enrichBedsWithRooms,
  filterVacantBeds,
  getVacantFloors,
  getVacantRooms,
  getVacantBedsForRoom,
  normId,
} from '../utils/vacancyHelpers'

const mapApiRoom = (r) => normalizeRoom({
  id: r.id,
  floorId: r.floorId,
  floorNumber: r.floorNumber,
  roomNumber: r.roomNumber,
  roomType: r.roomType || r.bedType,
  bedType: r.bedType || r.roomType,
  acType: r.acType,
  costPerBed: r.costOfBed,
})

const mapApiFloor = (f) => normalizeFloor({
  id: f.id,
  name: f.name || `Floor ${f.number}`,
  number: f.number,
  totalRooms: f.totalRooms ?? f.total_rooms ?? 0,
})

const mapApiBed = (b, { fromVacantEndpoint = false } = {}) => {
  const enriched = {
    id: b.id,
    bedNumber: b.bedNumber,
    roomId: b.roomId,
    roomNumber: b.roomNumber,
    floorId: b.floorId,
    floorNumber: b.floorNumber,
    cost: b.cost,
    status: b.status || (fromVacantEndpoint ? 'vacant' : undefined),
    customerId: b.customerId,
    bedType: b.bedType,
    occupied: b.occupied,
    isOccupied: b.isOccupied,
    vacant: b.vacant,
  }
  return normalizeBed(enriched, { assumeVacant: fromVacantEndpoint })
}

/**
 * Load floors / rooms / beds for booking & tenant dropdowns.
 * Fetches fresh API data and syncs Redux; falls back to store then bed-derived lists.
 */
export function useVacancyOptions({ enabled = true, debugLabel = 'Vacancy' } = {}) {
  const dispatch = useAppDispatch()
  const store = useHotel()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiData, setApiData] = useState({ floors: null, rooms: null, beds: null })

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [floorsRes, roomsRes, bedsRes] = await Promise.all([
        floorsApi.list().catch(() => []),
        roomsApi.list().catch(() => []),
        bedsApi.vacant().catch(() => bedsApi.list().catch(() => [])),
      ])

      const mappedFloors = (floorsRes || []).map(mapApiFloor)
      const mappedRooms = (roomsRes || []).map(mapApiRoom)
      const mappedBeds = enrichBedsWithRooms(
        (bedsRes || []).map((b) => mapApiBed(b, { fromVacantEndpoint: true })),
        mappedRooms,
      )

      setApiData({ floors: mappedFloors, rooms: mappedRooms, beds: mappedBeds })
      await loadRooms(dispatch)

      if (import.meta.env.DEV) {
        console.group(`[${debugLabel}] API Data`)
        console.log('floors:', mappedFloors.length, mappedFloors)
        console.log('rooms:', mappedRooms.length, mappedRooms)
        console.log('beds:', mappedBeds.length, mappedBeds)
        const vacantCount = filterVacantBeds(mappedBeds).length
        console.log('vacant beds:', vacantCount)
        if (mappedBeds.length && !vacantCount) {
          console.warn(`⚠️ ${mappedBeds.length} beds loaded but 0 detected as vacant.`)
          console.warn('Sample bed:', JSON.stringify(mappedBeds[0], null, 2))
          console.warn('Statuses:', [...new Set(mappedBeds.map((b) => b.status))])
          console.warn('CustomerIds:', [...new Set(mappedBeds.map((b) => String(b.customerId)))])
        }
        console.groupEnd()
      }

      return { floors: mappedFloors, rooms: mappedRooms, beds: mappedBeds }
    } catch (err) {
      console.error(`[${debugLabel}] load failed:`, err)
      setError(err.response?.data?.message || err.message || 'Failed to load vacancy data')
      return null
    } finally {
      setLoading(false)
    }
  }, [dispatch, debugLabel])

  useEffect(() => {
    if (enabled) reload()
  }, [enabled, reload])

  const floors = useMemo(() => {
    if (apiData.floors?.length) return apiData.floors
    if (store.floors?.length) return store.floors.map(normalizeFloor)
    const beds = apiData.beds?.length ? apiData.beds : store.beds.map((b) => normalizeBed(b, { assumeVacant: false }))
    if (beds.length) return buildFloorsFromBeds(beds).map(normalizeFloor)
    return []
  }, [apiData.floors, apiData.beds, store.floors, store.beds])

  const rooms = useMemo(() => {
    if (apiData.rooms?.length) return apiData.rooms
    if (store.rooms?.length) return store.rooms.map(normalizeRoom)
    const beds = apiData.beds?.length ? apiData.beds : store.beds.map((b) => normalizeBed(b))
    return buildRoomsFromBeds(beds).map(normalizeRoom)
  }, [apiData.rooms, apiData.beds, store.rooms, store.beds])

  const beds = useMemo(() => {
    const source = apiData.beds?.length
      ? apiData.beds
      : store.beds?.length
        ? enrichBedsWithRooms(
          store.beds.map((b) => normalizeBed(b)),
          store.rooms.map(normalizeRoom),
        )
        : []
    return source
  }, [apiData.beds, store.beds, store.rooms])

  const vacantBeds = useMemo(() => filterVacantBeds(beds), [beds])

  useEffect(() => {
    if (!import.meta.env.DEV || !enabled) return
    console.log(`[${debugLabel}] Floors`, floors)
    console.log(`[${debugLabel}] Rooms`, rooms)
    console.log(`[${debugLabel}] Beds`, beds)
    console.log(`[${debugLabel}] Vacant Beds`, vacantBeds)
    console.log(`[${debugLabel}] Vacant Floors (computed)`, getVacantFloors(floors, vacantBeds, rooms))
  }, [enabled, debugLabel, floors, rooms, beds, vacantBeds])

  return {
    floors,
    rooms,
    beds,
    vacantBeds,
    loading,
    error,
    reload,
    getVacantFloors: () => getVacantFloors(floors, vacantBeds, rooms),
    getVacantRooms: (selectedFloorId) => getVacantRooms(rooms, vacantBeds, floors, selectedFloorId),
    getVacantBedsForRoom: (roomId, includeBedId) => {
      const list = includeBedId
        ? [...vacantBeds, ...beds.filter((b) => String(b.id) === String(includeBedId) && !vacantBeds.some((v) => String(v.id) === String(b.id)))]
        : vacantBeds
      return getVacantBedsForRoom(list, roomId, rooms)
    },
  }
}
