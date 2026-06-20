import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import hotelReducer from './slices/hotelSlice'
import customerReducer from './slices/customerSlice'
import bookingReducer from './slices/bookingSlice'
import monthlyPaymentsReducer from './slices/monthlyPaymentsSlice'
import uiReducer from './slices/uiSlice'
import reportsReducer from './slices/reportsSlice'
import accountsReducer from './slices/accountsSlice'
import expensesReducer from './slices/expensesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotel: hotelReducer,
    customers: customerReducer,
    bookings: bookingReducer,
    monthlyPayments: monthlyPaymentsReducer,
    reports: reportsReducer,
    accounts: accountsReducer,
    expenses: expensesReducer,
    ui: uiReducer,
  },
})

export default store
