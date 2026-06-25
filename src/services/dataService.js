import { roomsApi, bedsApi, floorsApi, customersApi, bookingsApi, expensesApi, monthlyPaymentsApi, accountsApi, dashboardApi } from './endpoints.js'
import { setHotelData } from '../redux/slices/hotelSlice'
import { setCustomersList } from '../redux/slices/customerSlice'
import { setBookingsList } from '../redux/slices/bookingSlice'
import { setExpensesList } from '../redux/slices/expensesSlice'
import { setTenantsList } from '../redux/slices/monthlyPaymentsSlice'
import { setAccountsSummary } from '../redux/slices/accountsSlice'

import {
  normalizeBed,
  normalizeRoom,
  normalizeFloor,
  buildRoomsFromBeds,
  buildFloorsFromBeds,
  enrichBedsWithRooms,
  filterVacantBeds,
} from '../utils/vacancyHelpers.js'

const mapRoomsToFrontend = (rooms) => (rooms || []).map((r) => normalizeRoom({
  id: r.id,
  floorId: r.floorId,
  floorNumber: r.floorNumber,
  roomNumber: r.roomNumber,
  roomType: r.roomType || r.bedType,
  bedType: r.bedType || r.roomType,
  acType: r.acType,
  costPerBed: r.costOfBed,
}))

const buildFloorsFromRooms = (rooms) => {
  const map = new Map()
  rooms.forEach((r) => {
    const key = r.floorNumber
    if (!map.has(key)) {
      map.set(key, normalizeFloor({
        id: r.floorId || `floor-${r.floorNumber}`,
        name: `Floor ${r.floorNumber}`,
        number: r.floorNumber,
        totalRooms: 0,
      }))
    }
    map.get(key).totalRooms += 1
  })
  return [...map.values()]
}

export const loadRooms = async (dispatch) => {
  const [rooms, beds, apiFloors] = await Promise.all([
    roomsApi.list(),
    bedsApi.list(),
    floorsApi.list().catch(() => []),
  ])
  const mappedRooms = mapRoomsToFrontend(rooms)
  const mappedBeds = enrichBedsWithRooms(
    (beds || []).map((b) => normalizeBed({
      id: b.id,
      bedNumber: b.bedNumber,
      roomId: b.roomId,
      roomNumber: b.roomNumber,
      floorId: b.floorId,
      floorNumber: b.floorNumber,
      cost: b.cost,
      status: b.status,
      customerId: b.customerId,
      bedType: b.bedType,
    })),
    mappedRooms,
  )

  // Derive rooms from beds if rooms API returned empty but beds exist
  const finalRooms = mappedRooms.length ? mappedRooms : buildRoomsFromBeds(mappedBeds)

  let floors = buildFloorsFromRooms(finalRooms)
  if (apiFloors?.length) {
    const roomCounts = finalRooms.reduce((acc, r) => {
      acc[r.floorNumber] = (acc[r.floorNumber] || 0) + 1
      return acc
    }, {})
    const apiMapped = apiFloors.map((f) => normalizeFloor({
      id: f.id,
      name: f.name || `Floor ${f.number}`,
      number: f.number,
      totalRooms: roomCounts[f.number] ?? f.totalRooms ?? 0,
    }))
    // Merge API floors with floors derived from rooms/beds
    const merged = new Map()
    apiMapped.forEach((f) => merged.set(String(f.id), f))
    floors.forEach((f) => {
      if (!merged.has(String(f.id))) merged.set(String(f.id), f)
    })
    if (!merged.size) floors = buildFloorsFromBeds(mappedBeds)
    else floors = [...merged.values()].sort((a, b) => Number(a.number) - Number(b.number))
  } else if (!floors.length && mappedBeds.length) {
    floors = buildFloorsFromBeds(mappedBeds)
  }

  dispatch(setHotelData({ floors, rooms: finalRooms, beds: mappedBeds }))
  return { floors, rooms: finalRooms, beds: mappedBeds }
}

export const loadCustomers = async (dispatch) => {
  const data = await customersApi.list()
  dispatch(setCustomersList(data || []))
  return data
}

export const loadBookings = async (dispatch) => {
  const data = await bookingsApi.list()
  dispatch(setBookingsList(data || []))
  return data
}

export const loadExpenses = async (dispatch) => {
  const data = await expensesApi.list()
  dispatch(setExpensesList(data || []))
  return data
}

export const loadMonthlyPayments = async (dispatch) => {
  const data = await monthlyPaymentsApi.list()
  dispatch(setTenantsList(data || []))
  return data
}

export const loadVacancy = async (dispatch) => {
  const beds = await bedsApi.vacant()
  const mappedBeds = (beds || []).map((b) => normalizeBed({
    id: b.id,
    bedNumber: b.bedNumber,
    roomId: b.roomId,
    roomNumber: b.roomNumber,
    floorId: b.floorId,
    floorNumber: b.floorNumber,
    cost: b.cost,
    status: 'vacant',
    customerId: null,
    bedType: b.bedType,
  }))
  const rooms = buildRoomsFromBeds(mappedBeds)
  const floors = buildFloorsFromBeds(mappedBeds)
  dispatch(setHotelData({ floors, rooms, beds: mappedBeds }))
  return mappedBeds
}

export const loadAccounts = async (dispatch, params = {}) => {
  const data = await accountsApi.summary(params)
  dispatch(setAccountsSummary(data))
  return data
}

export const loadDashboardStats = async (dispatch) => {
  const stats = await dashboardApi.stats()
  return stats
}

export const loadAllData = async (dispatch) => {
  await Promise.all([
    loadRooms(dispatch),
    loadCustomers(dispatch),
    loadBookings(dispatch),
    loadExpenses(dispatch),
    loadMonthlyPayments(dispatch),
  ])
}
