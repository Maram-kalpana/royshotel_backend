import { createSlice } from '@reduxjs/toolkit'
import dailyReports from '../../data/dailyReports.json'

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    list: dailyReports,
  },
  reducers: {
    addReport: (state, action) => {
      state.list.unshift(action.payload)
    },
    updateReport: (state, action) => {
      const index = state.list.findIndex((r) => r.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    deleteReport: (state, action) => {
      state.list = state.list.filter((r) => r.id !== action.payload)
    },
  },
})

export const { addReport, updateReport, deleteReport } = reportsSlice.actions
export default reportsSlice.reducer
