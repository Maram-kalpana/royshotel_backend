import { createSlice } from '@reduxjs/toolkit'

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    list: [],
  },
  reducers: {
    setExpensesList: (state, action) => {
      state.list = action.payload || []
    },
    addExpense: (state, action) => {
      if (!Array.isArray(state.list)) state.list = []
      state.list.unshift(action.payload)
    },
    updateExpense: (state, action) => {
      const index = state.list.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    deleteExpense: (state, action) => {
      state.list = state.list.filter((e) => e.id !== action.payload)
    },
  },
})

export const { setExpensesList, addExpense, updateExpense, deleteExpense } = expensesSlice.actions
export default expensesSlice.reducer
