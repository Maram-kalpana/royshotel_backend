import { createSlice } from '@reduxjs/toolkit'
import { floors as floorsData, rooms as roomsData, beds as bedsData, stats as statsData } from '../../data'

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
    floors: floorsData,
    rooms: roomsData,
    beds: bedsData,
    stats: statsData,
  },
  reducers: {
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
      const { floorNumber, roomNumber, numberOfBeds, costPerBed } = action.payload
      const floor = state.floors.find((f) => f.number === Number(floorNumber))
      const floorId = floor?.id || `floor-${floorNumber}`
      const roomId = `room-${roomNumber}-${Date.now()}`

      state.rooms.push({
        id: roomId,
        floorId,
        floorNumber: Number(floorNumber),
        roomNumber: String(roomNumber),
        roomType: 'Standard',
        totalBeds: Number(numberOfBeds),
        occupiedBeds: 0,
        vacantBeds: Number(numberOfBeds),
        costPerBed: Number(costPerBed),
        status: 'available',
      })

      for (let i = 1; i <= Number(numberOfBeds); i += 1) {
        state.beds.push({
          id: `bed-${roomId}-${i}`,
          bedNumber: i,
          roomId,
          roomNumber: String(roomNumber),
          floorId,
          floorNumber: Number(floorNumber),
          cost: Number(costPerBed),
          status: 'vacant',
        })
      }

      recalcStats(state)
    },
    updateRoom: (state, action) => {
      const index = state.rooms.findIndex((r) => r.id === action.payload.id)
      if (index === -1) return

      const prev = state.rooms[index]
      const { floorNumber, roomNumber, numberOfBeds, costPerBed } = action.payload
      const floor = state.floors.find((f) => f.number === Number(floorNumber))
      const floorId = floor?.id || prev.floorId

      state.rooms[index] = {
        ...prev,
        floorId,
        floorNumber: Number(floorNumber),
        roomNumber: String(roomNumber),
        totalBeds: Number(numberOfBeds),
        costPerBed: Number(costPerBed),
      }

      const roomBeds = state.beds.filter((b) => b.roomId === prev.id)
      const newCount = Number(numberOfBeds)
      const currentCount = roomBeds.length

      roomBeds.forEach((bed) => {
        const bedIndex = state.beds.findIndex((b) => b.id === bed.id)
        if (bedIndex !== -1) {
          state.beds[bedIndex] = {
            ...state.beds[bedIndex],
            floorId,
            floorNumber: Number(floorNumber),
            roomNumber: String(roomNumber),
            cost: Number(costPerBed),
          }
        }
      })

      if (newCount > currentCount) {
        for (let i = currentCount + 1; i <= newCount; i += 1) {
          state.beds.push({
            id: `bed-${prev.id}-${i}-${Date.now()}`,
            bedNumber: i,
            roomId: prev.id,
            roomNumber: String(roomNumber),
            floorId,
            floorNumber: Number(floorNumber),
            cost: Number(costPerBed),
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
  addFloor, updateFloor, deleteFloor, addRoom, updateRoom, deleteRoom, updateBed, recalculateStats,
} = hotelSlice.actions
export default hotelSlice.reducer
