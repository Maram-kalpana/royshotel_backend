import api from './api.js'

const unwrap = (res) => {
  console.log('API Response:', res.data)
  return res.data?.data ?? res.data
}

export const authApi = {
  login: async (username, password) => {
    console.log('API Request Started: POST /auth/login')
    return unwrap(await api.post('/auth/login', { username, password }))
  },
  register: async (body) => {
    console.log('API Request Started: POST /auth/register')
    return unwrap(await api.post('/auth/register', body))
  },
  me: async () => {
    console.log('API Request Started: GET /auth/me')
    return unwrap(await api.get('/auth/me'))
  },
}

export const floorsApi = {
  list: async () => {
    console.log('API Request Started: GET /floors')
    return unwrap(await api.get('/floors'))
  },
}

export const dashboardApi = {
  stats: async () => {
    console.log('API Request Started: GET /dashboard/stats')
    return unwrap(await api.get('/dashboard/stats'))
  },
  vacancyStats: async () => {
    console.log('API Request Started: GET /dashboard/vacancy/stats')
    return unwrap(await api.get('/dashboard/vacancy/stats'))
  },
}

export const expensesApi = {
  list: async (params) => {
    console.log('API Request Started: GET /expenses')
    return unwrap(await api.get('/expenses', { params }))
  },
  create: async (data) => {
    console.log('API Request Started: POST /expenses')
    return unwrap(await api.post('/expenses', data))
  },
  update: async (id, data) => {
    console.log('API Request Started: PUT /expenses/' + id)
    return unwrap(await api.put(`/expenses/${id}`, data))
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /expenses/' + id)
    return unwrap(await api.delete(`/expenses/${id}`))
  },
}

export const roomsApi = {
  list: async (params) => {
    console.log('API Request Started: GET /rooms')
    return unwrap(await api.get('/rooms', { params }))
  },
  get: async (id) => {
    console.log('API Request Started: GET /rooms/' + id)
    return unwrap(await api.get(`/rooms/${id}`))
  },
  create: async (data) => {
    console.log('API Request Started: POST /rooms')
    return unwrap(await api.post('/rooms', data))
  },
  update: async (id, data) => {
    console.log('API Request Started: PUT /rooms/' + id)
    return unwrap(await api.put(`/rooms/${id}`, data))
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /rooms/' + id)
    return unwrap(await api.delete(`/rooms/${id}`))
  },
}

export const bedsApi = {
  list: async (params) => {
    console.log('API Request Started: GET /beds')
    return unwrap(await api.get('/beds', { params }))
  },
  vacant: async (params) => {
    console.log('API Request Started: GET /beds/vacant')
    return unwrap(await api.get('/beds/vacant', { params }))
  },
  update: async (id, data) => {
    console.log('API Request Started: PATCH /beds/' + id)
    return unwrap(await api.patch(`/beds/${id}`, data))
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /beds/' + id)
    return unwrap(await api.delete(`/beds/${id}`))
  },
}

export const customersApi = {
  list: async (params) => {
    console.log('API Request Started: GET /customers')
    return unwrap(await api.get('/customers', { params }))
  },
  create: async (data) => {
    console.log('API Request Started: POST /customers')
    return unwrap(await api.post('/customers', data))
  },
  update: async (id, data) => {
    console.log('API Request Started: PUT /customers/' + id)
    return unwrap(await api.put(`/customers/${id}`, data))
  },
  checkout: async (id) => {
    console.log('API Request Started: POST /customers/' + id + '/checkout')
    return unwrap(await api.post(`/customers/${id}/checkout`))
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /customers/' + id)
    return unwrap(await api.delete(`/customers/${id}`))
  },
}

export const bookingsApi = {
  list: async (params) => {
    console.log('API Request Started: GET /bookings')
    return unwrap(await api.get('/bookings', { params }))
  },
  create: async (data) => {
    console.log('API Request Started: POST /bookings')
    return unwrap(await api.post('/bookings', data))
  },
  update: async (id, data) => {
    console.log('API Request Started: PUT /bookings/' + id)
    return unwrap(await api.put(`/bookings/${id}`, data))
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /bookings/' + id)
    return unwrap(await api.delete(`/bookings/${id}`))
  },
}

export const monthlyPaymentsApi = {
  list: async (params) => {
    console.log('API Request Started: GET /monthly-payments')
    return unwrap(await api.get('/monthly-payments', { params }))
  },
  pending: async () => {
    console.log('API Request Started: GET /monthly-payments/pending')
    return unwrap(await api.get('/monthly-payments/pending'))
  },
  paid: async () => {
    console.log('API Request Started: GET /monthly-payments/paid')
    return unwrap(await api.get('/monthly-payments/paid'))
  },
  create: async (data) => {
    console.log('API Request Started: POST /monthly-payments')
    return unwrap(await api.post('/monthly-payments', data))
  },
  update: async (id, data) => {
    console.log('API Request Started: PUT /monthly-payments/' + id)
    return unwrap(await api.put(`/monthly-payments/${id}`, data))
  },
  markPaid: async (id, data) => {
    console.log('API Request Started: POST /monthly-payments/' + id + '/mark-paid')
    return unwrap(await api.post(`/monthly-payments/${id}/mark-paid`, data))
  },
  addPayment: async (id, data) => {
    console.log('API Request Started: PUT /monthly-payments/' + id + '/add-payment')
    return unwrap(await api.put(`/monthly-payments/${id}/add-payment`, data))
  },
  getById: async (id) => {
    console.log('API Request Started: GET /monthly-payments/' + id)
    return unwrap(await api.get(`/monthly-payments/${id}`))
  },
  dues: async (params) => {
    console.log('API Request Started: GET /monthly-payments/dues')
    return unwrap(await api.get('/monthly-payments/dues', { params }))
  },
  collectionSummary: async (params) => {
    console.log('API Request Started: GET /monthly-payments/collection-summary')
    return unwrap(await api.get('/monthly-payments/collection-summary', { params }))
  },
  exportCsv: async (params) => {
    console.log('API Request Started: GET /monthly-payments/export')
    const res = await api.get('/monthly-payments/export', { params, responseType: 'blob' })
    return res.data
  },
  remove: async (id) => {
    console.log('API Request Started: DELETE /monthly-payments/' + id)
    return unwrap(await api.delete(`/monthly-payments/${id}`))
  },
}

export const accountsApi = {
  summary: async (params) => {
    console.log('API Request Started: GET /accounts/summary')
    return unwrap(await api.get('/accounts/summary', { params }))
  },
}

export const settingsApi = {
  get: async () => {
    console.log('API Request Started: GET /settings')
    return unwrap(await api.get('/settings'))
  },
  update: async (data) => {
    console.log('API Request Started: PUT /settings')
    return unwrap(await api.put('/settings', data))
  },
}
