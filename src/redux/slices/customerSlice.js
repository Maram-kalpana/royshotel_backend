import { createSlice } from '@reduxjs/toolkit'

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [],
    history: [],
    selectedCustomer: null,
  },
  reducers: {
    setCustomersList: (state, action) => {
      const all = action.payload || []
      state.list = all.filter((c) => c.status !== 'checked-out')
      state.history = all.filter((c) => c.status === 'checked-out')
    },
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

export const { setCustomersList, addCustomer, updateCustomer, setSelectedCustomer, checkoutCustomer } = customerSlice.actions
export default customerSlice.reducer
