import { roomsApi, bedsApi, customersApi, bookingsApi, expensesApi, monthlyPaymentsApi, accountsApi, dashboardApi } from './endpoints.js'
import { setHotelData } from '../redux/slices/hotelSlice'
import { setCustomersList } from '../redux/slices/customerSlice'
import { setBookingsList } from '../redux/slices/bookingSlice'
import { setExpensesList } from '../redux/slices/expensesSlice'
import { setTenantsList } from '../redux/slices/monthlyPaymentsSlice'
import { setAccountsSummary } from '../redux/slices/accountsSlice'

const mapRoomsToFrontend = (rooms) => rooms.map((r) => ({
  id: r.id,
  floorId: r.floorId,
  floorNumber: r.floorNumber,
  roomNumber: r.roomNumber,
  roomType: r.roomType || r.bedType,
  bedType: r.bedType || r.roomType,
  acType: r.acType,
  totalBeds: r.totalBeds || 1,
  occupiedBeds: r.occupiedBeds || 0,
  vacantBeds: r.vacantBeds || 0,
  costPerBed: r.costOfBed,
  status: r.status || 'available',
}))

const buildFloorsFromRooms = (rooms) => {
  const map = new Map()
  rooms.forEach((r) => {
    if (!map.has(r.floorNumber)) {
      map.set(r.floorNumber, {
        id: r.floorId || `floor-${r.floorNumber}`,
        name: `Floor ${r.floorNumber}`,
        number: r.floorNumber,
        totalRooms: 0,
      })
    }
    map.get(r.floorNumber).totalRooms += 1
  })
  return [...map.values()]
}

export const loadRooms = async (dispatch) => {
  const [rooms, beds] = await Promise.all([roomsApi.list(), bedsApi.list()])
  const mappedRooms = mapRoomsToFrontend(rooms || [])
  const mappedBeds = (beds || []).map((b) => ({
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
  }))
  const floors = buildFloorsFromRooms(mappedRooms)
  dispatch(setHotelData({ floors, rooms: mappedRooms, beds: mappedBeds }))
  return { floors, rooms: mappedRooms, beds: mappedBeds }
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
  const mappedBeds = (beds || []).map((b) => ({
    id: b.id,
    bedNumber: b.bedNumber,
    roomId: b.roomId,
    roomNumber: b.roomNumber,
    floorId: b.floorId,
    floorNumber: b.floorNumber,
    cost: b.cost,
    status: 'vacant',
    customerId: null,
  }))
  dispatch(setHotelData({
    floors: buildFloorsFromRooms(mappedBeds.map((b) => ({ floorNumber: b.floorNumber, floorId: b.floorId }))),
    rooms: [],
    beds: mappedBeds,
  }))
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
