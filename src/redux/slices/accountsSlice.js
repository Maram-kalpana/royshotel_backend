import { createSlice } from '@reduxjs/toolkit'
import incomeRecords from '../../data/incomeRecords.json'

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    list: incomeRecords,
  },
  reducers: {
    addIncome: (state, action) => {
      state.list.unshift(action.payload)
    },
    updateIncome: (state, action) => {
      const index = state.list.findIndex((r) => r.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    deleteIncome: (state, action) => {
      state.list = state.list.filter((r) => r.id !== action.payload)
    },
  },
})

export const { addIncome, updateIncome, deleteIncome } = accountsSlice.actions
export default accountsSlice.reducer
