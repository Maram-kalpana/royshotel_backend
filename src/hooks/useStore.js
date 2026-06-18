import { useSelector, useDispatch } from 'react-redux'

export const useAuth = () => useSelector((state) => state.auth)
export const useHotel = () => useSelector((state) => state.hotel)
export const useCustomers = () => useSelector((state) => state.customers)
export const useBookings = () => useSelector((state) => state.bookings)
export const useUI = () => useSelector((state) => state.ui)
export const useReports = () => useSelector((state) => state.reports)
export const useAccounts = () => useSelector((state) => state.accounts)
export const useAppDispatch = () => useDispatch()
