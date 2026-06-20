import { createSlice } from '@reduxjs/toolkit'
import expenses from '../../data/expenses.json'

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: {
    list: expenses,
  },
  reducers: {
    addExpense: (state, action) => {
      if (!Array.isArray(state.list)) state.list = []
      const newExpense = {
        id: `exp-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      }
      state.list.unshift(newExpense)
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

export const { addExpense, updateExpense, deleteExpense } = expensesSlice.actions
export default expensesSlice.reducer
