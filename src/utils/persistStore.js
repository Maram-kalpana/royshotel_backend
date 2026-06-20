const STORAGE_KEY = 'hotel_app_state'

export const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const savePersistedState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hotel: state.hotel,
      customers: state.customers,
      bookings: state.bookings,
      monthlyPayments: state.monthlyPayments,
      expenses: state.expenses,
    }))
  } catch {
    // ignore quota errors
  }
}

export const setupStorePersistence = (store) => {
  store.subscribe(() => {
    savePersistedState(store.getState())
  })
}
