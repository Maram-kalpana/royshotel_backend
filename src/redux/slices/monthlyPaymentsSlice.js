import { createSlice } from '@reduxjs/toolkit'
import { resolveTenantStatus } from '../../utils/monthlyPaymentHelpers'

const syncTenantStatus = (tenant) => ({
  ...tenant,
  status: resolveTenantStatus(tenant),
})

const monthlyPaymentsSlice = createSlice({
  name: 'monthlyPayments',
  initialState: {
    tenants: [],
  },
  reducers: {
    setTenantsList: (state, action) => {
      state.tenants = (action.payload || []).map(syncTenantStatus)
    },
    markTenantPaid: (state, action) => {
      const { tenantId, month, amount, paymentMode, paidDate } = action.payload
      const tenant = state.tenants.find((t) => t.id === tenantId)
      if (!tenant) return

      let record = tenant.paymentHistory?.find((p) => p.month === month)
      if (record) {
        record.amount = Number(amount)
        record.paidDate = paidDate
        record.status = 'paid'
        record.paymentMode = paymentMode
      } else {
        tenant.paymentHistory = tenant.paymentHistory || []
        tenant.paymentHistory.push({
          id: `ph-${tenantId}-${Date.now()}`,
          month,
          amount: Number(amount),
          paidDate,
          status: 'paid',
          paymentMode,
        })
      }

      tenant.lastPaidMonth = month
      tenant.status = resolveTenantStatus(tenant)
    },
    addTenant: (state, action) => {
      state.tenants.unshift(syncTenantStatus(action.payload))
    },
    updateTenant: (state, action) => {
      const { tenantId, ...updates } = action.payload
      const index = state.tenants.findIndex((t) => t.id === tenantId)
      if (index === -1) return
      state.tenants[index] = syncTenantStatus({
        ...state.tenants[index],
        ...updates,
        customerName: updates.name || updates.customerName || state.tenants[index].customerName,
      })
    },
    refreshTenantStatuses: (state) => {
      state.tenants = state.tenants.map(syncTenantStatus)
    },
    deleteTenant: (state, action) => {
      state.tenants = state.tenants.filter((t) => t.id !== action.payload)
    },
  },
})

export const {
  setTenantsList, markTenantPaid, addTenant, updateTenant, refreshTenantStatuses, deleteTenant,
} = monthlyPaymentsSlice.actions
export default monthlyPaymentsSlice.reducer
