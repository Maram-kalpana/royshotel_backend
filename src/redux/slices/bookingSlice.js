import { createSlice } from '@reduxjs/toolkit'

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    list: [],
  },
  reducers: {
    setBookingsList: (state, action) => {
      state.list = action.payload || []
    },
    addBooking: (state, action) => {
      state.list.unshift(action.payload)
    },
    updateBooking: (state, action) => {
      const index = state.list.findIndex((b) => b.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    deleteBooking: (state, action) => {
      state.list = state.list.filter((b) => b.id !== action.payload)
    },
  },
})

export const { setBookingsList, addBooking, updateBooking, deleteBooking } = bookingSlice.actions
export default bookingSlice.reducer
