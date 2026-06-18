export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const getBedStatusColor = (status) => {
  switch (status) {
    case 'vacant':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', hex: '#10b981' }
    case 'occupied':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', hex: '#ef4444' }
    case 'reserved':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', hex: '#f59e0b' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', hex: '#64748b' }
  }
}

export const getOccupancyPercentage = (occupied, total) => {
  if (!total) return 0
  return Math.round((occupied / total) * 100)
}

export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
}

const BASE_MENU = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Rooms', path: '/rooms', icon: 'DoorOpen' },
  { label: 'Customers', path: '/customers', icon: 'Users' },
  { label: 'Bookings', path: '/bookings', icon: 'CalendarCheck' },
  { label: 'Pendings', path: '/pendings', icon: 'Clock' },
  { label: 'Vacancy', path: '/vacancy', icon: 'MapPin' },
  { label: 'Accounts', path: '/accounts', icon: 'Wallet' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]

export const SUPER_ADMIN_MENU_ITEMS = BASE_MENU
export const ADMIN_MENU_ITEMS = BASE_MENU

export const getMenuItems = (role) =>
  role === ROLES.SUPER_ADMIN ? SUPER_ADMIN_MENU_ITEMS : ADMIN_MENU_ITEMS

export const getRoomStatus = (room, beds) => {
  const roomBeds = beds.filter((b) => b.roomId === room.id)
  if (!roomBeds.length) return 'vacant'
  return roomBeds.some((b) => b.status !== 'vacant') ? 'occupied' : 'vacant'
}

export const getRoomCostPerBed = (room, beds) => {
  const roomBeds = beds.filter((b) => b.roomId === room.id)
  if (!roomBeds.length) return room.costPerBed || 0
  return room.costPerBed ?? roomBeds[0]?.cost ?? 0
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isSameDay = (d1, d2) => {
  const a = new Date(d1)
  const b = new Date(d2)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const isInDateRange = (date, from, to) => {
  const d = new Date(date)
  return d >= new Date(from) && d <= new Date(to)
}

export const getMonthYear = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const getPaymentStatus = (balanceAmount) =>
  (balanceAmount ?? 0) > 0 ? 'pending' : 'paid'

export const getPaymentStatusBadge = (status) => {
  if (status === 'paid') {
    return { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
  return { label: 'Pending', className: 'bg-red-100 text-red-700 border-red-200' }
}

export const getBookingPaymentInfo = (booking) => {
  const balanceAmount = booking?.balanceAmount ?? 0
  return {
    balanceAmount,
    paymentStatus: getPaymentStatus(balanceAmount),
  }
}
export const getStatusBadge = (status) => {
  const normalized = status?.toLowerCase()
  if (normalized === 'vacant' || normalized === 'available') {
    return { label: 'Vacant', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
  if (normalized === 'occupied' || normalized === 'booked' || normalized === 'checked-in' || normalized === 'active' || normalized === 'pending') {
    return { label: normalized === 'booked' ? 'Booked' : normalized === 'checked-in' ? 'Checked-in' : normalized === 'pending' ? 'Pending' : 'Occupied', className: 'bg-red-100 text-red-700 border-red-200' }
  }
  return { label: status || 'Unknown', className: 'bg-slate-100 text-slate-700 border-slate-200' }
}
