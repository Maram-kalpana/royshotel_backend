import { createSlice } from '@reduxjs/toolkit'

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    summary: null,
    list: [],
  },
  reducers: {
    setAccountsSummary: (state, action) => {
      state.summary = action.payload
    },
    addIncome: (state, action) => {
      state.list.unshift(action.payload)
    },
    updateIncome: (state, action) => {
      const index = state.list.findIndex((i) => i.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    deleteIncome: (state, action) => {
      state.list = state.list.filter((i) => i.id !== action.payload)
    },
  },
})

export const { setAccountsSummary, addIncome, updateIncome, deleteIncome } = accountsSlice.actions
export default accountsSlice.reducer
