import { createSlice } from '@reduxjs/toolkit'

const emptyStats = {
  totalFloors: 0,
  totalRooms: 0,
  totalBeds: 0,
  occupiedBeds: 0,
  vacantBeds: 0,
  reservedBeds: 0,
  totalCustomers: 0,
  revenue: 0,
  pendingPayments: 0,
  todayCheckIns: 0,
  todayCheckOuts: 0,
}

const recalcStats = (state) => {
  state.stats.totalFloors = state.floors.length
  state.stats.totalRooms = state.rooms.length
  state.stats.totalBeds = state.beds.length
  state.stats.occupiedBeds = state.beds.filter((b) => b.status === 'occupied').length
  state.stats.vacantBeds = state.beds.filter((b) => b.status === 'vacant').length
  state.stats.reservedBeds = state.beds.filter((b) => b.status === 'reserved').length
}

const hotelSlice = createSlice({
  name: 'hotel',
  initialState: {
    floors: [],
    rooms: [],
    beds: [],
    stats: { ...emptyStats },
  },
  reducers: {
    setHotelData: (state, action) => {
      const { floors, rooms, beds } = action.payload
      if (floors) state.floors = floors
      if (rooms) state.rooms = rooms
      if (beds) state.beds = beds
      recalcStats(state)
    },
    addFloor: (state, action) => {
      state.floors.push(action.payload)
      recalcStats(state)
    },
    updateFloor: (state, action) => {
      const index = state.floors.findIndex((f) => f.id === action.payload.id)
      if (index !== -1) state.floors[index] = { ...state.floors[index], ...action.payload }
    },
    deleteFloor: (state, action) => {
      state.floors = state.floors.filter((f) => f.id !== action.payload)
      recalcStats(state)
    },
    addRoom: (state, action) => {
      const { floorNumber, roomNumber, numberOfBeds, bedType, costPerBed, costOfBed, acType } = action.payload
      const floor = state.floors.find((f) => f.number === Number(floorNumber))
      const floorId = floor?.id || `floor-${floorNumber}`
      const roomId = `room-${roomNumber}-${Date.now()}`
      const bedCount = Number(numberOfBeds) || 1
      const cost = Number(costOfBed ?? costPerBed) || 0
      const type = bedType || 'Standard'

      state.rooms.push({
        id: roomId,
        floorId,
        floorNumber: Number(floorNumber),
        roomNumber: String(roomNumber),
        roomType: type,
        bedType: type,
        acType: acType || 'Non A/C',
        totalBeds: bedCount,
        occupiedBeds: 0,
        vacantBeds: bedCount,
        costPerBed: cost,
        status: 'available',
      })

      for (let i = 1; i <= bedCount; i += 1) {
        state.beds.push({
          id: `bed-${roomId}-${i}`,
          bedNumber: i,
          bedType: type,
          roomId,
          roomNumber: String(roomNumber),
          floorId,
          floorNumber: Number(floorNumber),
          cost,
          status: 'vacant',
        })
      }

      recalcStats(state)
    },
    updateRoom: (state, action) => {
      const index = state.rooms.findIndex((r) => r.id === action.payload.id)
      if (index === -1) return

      const prev = state.rooms[index]
      const { floorNumber, roomNumber, numberOfBeds, bedType, costPerBed, costOfBed, acType } = action.payload
      const floor = state.floors.find((f) => f.number === Number(floorNumber))
      const floorId = floor?.id || prev.floorId
      const type = bedType || prev.bedType || prev.roomType || 'Standard'
      const cost = Number(costOfBed ?? costPerBed) || prev.costPerBed || 0

      state.rooms[index] = {
        ...prev,
        floorId,
        floorNumber: Number(floorNumber),
        roomNumber: String(roomNumber),
        roomType: type,
        bedType: type,
        acType: acType || prev.acType || 'Non A/C',
        totalBeds: Number(numberOfBeds) || prev.totalBeds,
        costPerBed: cost,
      }

      const roomBeds = state.beds.filter((b) => b.roomId === prev.id)
      const newCount = Number(numberOfBeds) || roomBeds.length
      const currentCount = roomBeds.length

      roomBeds.forEach((bed) => {
        const bedIndex = state.beds.findIndex((b) => b.id === bed.id)
        if (bedIndex !== -1) {
          state.beds[bedIndex] = {
            ...state.beds[bedIndex],
            floorId,
            floorNumber: Number(floorNumber),
            roomNumber: String(roomNumber),
            bedType: type,
            cost,
          }
        }
      })

      if (newCount > currentCount) {
        for (let i = currentCount + 1; i <= newCount; i += 1) {
          state.beds.push({
            id: `bed-${prev.id}-${i}-${Date.now()}`,
            bedNumber: i,
            bedType: type,
            roomId: prev.id,
            roomNumber: String(roomNumber),
            floorId,
            floorNumber: Number(floorNumber),
            cost,
            status: 'vacant',
          })
        }
      } else if (newCount < currentCount) {
        const vacantBeds = roomBeds.filter((b) => b.status === 'vacant')
        const toRemove = currentCount - newCount
        vacantBeds.slice(0, toRemove).forEach((bed) => {
          state.beds = state.beds.filter((b) => b.id !== bed.id)
        })
      }

      const updatedBeds = state.beds.filter((b) => b.roomId === prev.id)
      state.rooms[index].vacantBeds = updatedBeds.filter((b) => b.status === 'vacant').length
      state.rooms[index].occupiedBeds = updatedBeds.filter((b) => b.status !== 'vacant').length
      state.rooms[index].totalBeds = updatedBeds.length

      recalcStats(state)
    },
    deleteRoom: (state, action) => {
      const roomId = action.payload
      state.rooms = state.rooms.filter((r) => r.id !== roomId)
      state.beds = state.beds.filter((b) => b.roomId !== roomId)
      recalcStats(state)
    },
    updateBed: (state, action) => {
      const index = state.beds.findIndex((b) => b.id === action.payload.id)
      if (index !== -1) state.beds[index] = { ...state.beds[index], ...action.payload }
      recalcStats(state)
    },
    recalculateStats: (state) => {
      recalcStats(state)
    },
  },
})

export const {
  setHotelData,
  addFloor, updateFloor, deleteFloor, addRoom, updateRoom, deleteRoom, updateBed, recalculateStats,
} = hotelSlice.actions
export default hotelSlice.reducer
