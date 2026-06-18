import { createSlice } from '@reduxjs/toolkit'
import { customers as customersData } from '../../data'

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    list: customersData.filter((c) => c.status !== 'checked-out'),
    history: customersData.filter((c) => c.status === 'checked-out'),
    selectedCustomer: null,
  },
  reducers: {
    addCustomer: (state, action) => {
      state.list.unshift(action.payload)
    },
    updateCustomer: (state, action) => {
      const index = state.list.findIndex((c) => c.id === action.payload.id)
      if (index !== -1) state.list[index] = { ...state.list[index], ...action.payload }
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload
    },
    checkoutCustomer: (state, action) => {
      const index = state.list.findIndex((c) => c.id === action.payload)
      if (index !== -1) {
        const customer = {
          ...state.list[index],
          status: 'checked-out',
          checkOutDate: new Date().toISOString().split('T')[0],
        }
        state.history.unshift(customer)
        state.list.splice(index, 1)
      }
    },
  },
})

export const { addCustomer, updateCustomer, setSelectedCustomer, checkoutCustomer } = customerSlice.actions
export default customerSlice.reducer
