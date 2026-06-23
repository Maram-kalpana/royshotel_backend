/** Helpers for monthly rent payments — replace with API calls when backend is ready */

export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer']

export const MODES_REQUIRING_TXN = ['UPI', 'Card', 'Bank Transfer']

export const MONTHLY_PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  PARTIAL: 'partial',
  DUE_SOON: 'due_soon',
}

export const computePaymentStatus = (totalRent, totalPaid) => {
  const rent = Number(totalRent) || 0
  const paid = Number(totalPaid) || 0
  if (paid <= 0) return MONTHLY_PAYMENT_STATUS.PENDING
  if (paid >= rent) return MONTHLY_PAYMENT_STATUS.PAID
  return MONTHLY_PAYMENT_STATUS.PARTIAL
}

export const getCurrentMonthYear = (date = new Date()) =>
  date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const getDueDateLabel = (dueDay) => `${dueDay}${getDaySuffix(dueDay)} of every month`

const getDaySuffix = (day) => {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export const getTenantCurrentMonthRecord = (tenant, monthYear = getCurrentMonthYear()) =>
  tenant.paymentHistory?.find((p) => p.month === monthYear)

export const resolveTenantStatus = (tenant, monthYear = getCurrentMonthYear()) => {
  const current = getTenantCurrentMonthRecord(tenant, monthYear)
  if (!current) return MONTHLY_PAYMENT_STATUS.PENDING
  if (current.status === 'paid') return MONTHLY_PAYMENT_STATUS.PAID

  const today = new Date()
  const dueDate = new Date(today.getFullYear(), today.getMonth(), tenant.dueDay || 1)
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

  if (daysUntilDue >= 0 && daysUntilDue <= 5) return MONTHLY_PAYMENT_STATUS.DUE_SOON
  return MONTHLY_PAYMENT_STATUS.PENDING
}

export const isCurrentMonthPending = (tenant, monthYear = getCurrentMonthYear()) => {
  const current = getTenantCurrentMonthRecord(tenant, monthYear)
  return !current || current.status !== 'paid'
}

/** Dashboard KPIs derived from tenant list */
export const computeMonthlyPaymentStats = (tenants, monthYear = getCurrentMonthYear()) => {
  const monthlyTenants = tenants.length
  const paymentsDue = tenants.filter((t) => isCurrentMonthPending(t, monthYear)).length
  const pendingPayments = tenants.filter((t) => resolveTenantStatus(t, monthYear) === MONTHLY_PAYMENT_STATUS.PENDING).length

  const collectionThisMonth = tenants.reduce((sum, tenant) => {
    const record = getTenantCurrentMonthRecord(tenant, monthYear)
    if (record?.status === 'paid') return sum + (record.amount || 0)
    return sum
  }, 0)

  const expectedCollection = tenants.reduce((sum, tenant) => sum + (tenant.monthlyRent || 0), 0)

  return {
    monthlyTenants,
    paymentsDue,
    pendingPayments,
    collectionThisMonth,
    expectedCollection,
  }
}

export const getMonthlyStatusBadge = (status) => {
  switch (status) {
    case MONTHLY_PAYMENT_STATUS.PAID:
      return { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case MONTHLY_PAYMENT_STATUS.PARTIAL:
      return { label: 'Partial', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case MONTHLY_PAYMENT_STATUS.DUE_SOON:
      return { label: 'Due Soon', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    default:
      return { label: 'Pending', className: 'bg-red-100 text-red-700 border-red-200' }
  }
}
