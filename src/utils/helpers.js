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

export const formatTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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

export const LOGIN_CREDENTIALS = {
  [ROLES.SUPER_ADMIN]: {
    username: 'superadmin',
    password: 'SuperAdmin@123',
    name: 'Super Admin',
    id: 'super-admin-1',
  },
  [ROLES.ADMIN]: {
    username: 'admin',
    password: 'Admin@123',
    name: 'Hotel Admin',
    id: 'admin-1',
  },
}

export const displayValue = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback
  return value
}

/** True for http(s), /uploads/, data:image/, and blob: preview URLs. */
export const isValidImageUrl = (url) =>
  typeof url === 'string' &&
  url.length > 4 &&
  (
    url.startsWith('http') ||
    url.startsWith('data:image/') ||
    url.startsWith('/uploads/') ||
    url.startsWith('blob:')
  )

/** Normalize image src for <img> — relative /uploads/ paths work via Vite proxy. */
export const getImageSrc = (url) => {
  if (!isValidImageUrl(url)) return null
  return url
}

const COMMON_MENU = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Rooms', path: '/rooms', icon: 'DoorOpen' },
  { label: 'Customers', path: '/customers', icon: 'Users' },
  { label: 'Bookings', path: '/bookings', icon: 'CalendarCheck' },
  { label: 'Monthly Tenants', path: '/monthly-payments', icon: 'Receipt' },
  { label: 'Vacancy', path: '/vacancy', icon: 'MapPin' },
  { label: 'Expenses', path: '/expenses', icon: 'Wallet' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]

export const SUPER_ADMIN_MENU_ITEMS = [
  ...COMMON_MENU.slice(0, 6),
  { label: 'Income', path: '/accounts', icon: 'CreditCard' },
  { label: 'Expenses', path: '/expenses', icon: 'Wallet' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]

export const ADMIN_MENU_ITEMS = COMMON_MENU

export const getMenuItems = (role) =>
  role === ROLES.SUPER_ADMIN ? SUPER_ADMIN_MENU_ITEMS : ADMIN_MENU_ITEMS

const ROUTE_TITLES = {
  '/super-admin/dashboard': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/rooms': 'Rooms',
  '/customers': 'Customers',
  '/bookings': 'Bookings',
  '/monthly-payments': 'Monthly Tenants',
  '/vacancy': 'Vacancy',
  '/accounts': 'Income',
  '/expenses': 'Expenses',
  '/settings': 'Settings',
}

export const getPageTitle = (pathname) => {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  if (pathname.startsWith('/customers/')) return 'Customer Profile'
  if (pathname.startsWith('/checkout/')) return 'Checkout'
  return 'Dashboard'
}

export const getRoomStatus = (room, beds) => {
  const roomBeds = beds.filter((b) => String(b.roomId) === String(room.id))
  if (!roomBeds.length) return 'vacant'
  return roomBeds.some((b) => b.status !== 'vacant') ? 'occupied' : 'vacant'
}

export const getRoomCostPerBed = (room, beds) => {
  const roomBeds = beds.filter((b) => String(b.roomId) === String(room.id))
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

export const getPaymentStatus = (balanceAmount, explicitStatus) => {
  if (explicitStatus === 'completed' || explicitStatus === 'pending') return explicitStatus
  return (balanceAmount ?? 0) > 0 ? 'pending' : 'completed'
}

export const getPaymentStatusBadge = (status) => {
  if (status === 'completed') {
    return { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', color: 'success' }
  }
  return { label: 'Pending', className: 'bg-orange-100 text-orange-700 border-orange-200', color: 'warning' }
}

export const parseDurationInput = (input) => {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return { duration: 1, stayType: 'Days' }

  const match = trimmed.match(/^(\d+)\s*(hours?|days?|weeks?|months?)?$/i)
  if (match) {
    const duration = parseInt(match[1], 10)
    const unit = (match[2] || 'days').toLowerCase()
    let stayType = 'Days'
    if (unit.startsWith('hour')) stayType = 'Hours'
    else if (unit.startsWith('week')) stayType = 'Weeks'
    else if (unit.startsWith('month')) stayType = 'Months'
    return { duration, stayType }
  }

  if (/^\d+$/.test(trimmed)) {
    return { duration: parseInt(trimmed, 10), stayType: 'Days' }
  }

  return { duration: 1, stayType: 'Days', label: trimmed }
}

export const formatStayDuration = (duration, stayType, label) => {
  if (label) return label
  if (!duration && !stayType) return '—'
  return `${duration || 0} ${stayType || 'Days'}`
}

/** Map booking stay type to customer-facing label */
export const mapStayTypeLabel = (stayType) => {
  if (!stayType) return 'Daily'
  const t = stayType.toLowerCase()
  if (t === 'months' || t === 'monthly') return 'Monthly'
  if (t === 'weeks' || t === 'weekly') return 'Weekly'
  return 'Daily'
}

/** Compute expected exit date from booking duration */
export const computeExpectedCheckOut = (booking, customer) => {
  if (booking?.checkOutDateTime) return booking.checkOutDateTime
  if (customer?.checkOutDate) return customer.checkOutDate
  if (customer?.exitDate) return customer.exitDate
  if (!booking?.checkInDate && !booking?.checkInDateTime && !customer?.checkInDate) return null

  const checkIn = new Date(booking?.checkInDateTime || booking?.checkInDate || customer?.checkInDate)
  if (Number.isNaN(checkIn.getTime())) return null

  const duration = booking?.duration || 1
  const stayType = booking?.stayType || 'Days'
  const exit = new Date(checkIn)

  if (stayType === 'Hours') exit.setHours(exit.getHours() + duration)
  else if (stayType === 'Days') exit.setDate(exit.getDate() + duration)
  else if (stayType === 'Weeks') exit.setDate(exit.getDate() + duration * 7)
  else if (stayType === 'Months') exit.setMonth(exit.getMonth() + duration)

  return exit.toISOString()
}

/** Actual check-out only — no computed or placeholder values */
export const getActualCheckOutDateTime = (customer, booking) => {
  const raw = booking?.checkOutDateTime || customer?.checkOutDateTime || customer?.checkOutDate || customer?.exitDate
  if (!raw) return null
  return raw
}

export const getCheckInDateTime = (customer, booking) =>
  booking?.checkInDateTime || customer?.checkInDateTime || customer?.checkInDate || null

export const formatCheckInDateTime = (customer, booking) => {
  const raw = getCheckInDateTime(customer, booking)
  if (!raw) return '—'
  return formatDateTime(raw)
}

export const formatCheckOutDateTime = (customer, booking) => {
  const raw = getActualCheckOutDateTime(customer, booking)
  if (!raw) return '—'
  return formatDateTime(raw)
}

/** @deprecated use getActualCheckOutDateTime — kept for compatibility */
export const getCustomerCheckOutDisplay = (customer, booking) => getActualCheckOutDateTime(customer, booking)

export const formatCheckOutDisplay = (customer, booking) => formatCheckOutDateTime(customer, booking)

export const getBookingPaymentInfo = (booking) => {
  const balanceAmount = booking?.balanceAmount ?? 0
  return {
    balanceAmount,
    paymentStatus: booking?.paymentStatus || getPaymentStatus(balanceAmount),
  }
}

export const computeHotelStats = (hotel, customers, bookings) => {
  const { beds, rooms } = hotel
  const today = new Date().toISOString().split('T')[0]
  const totalBeds = beds?.length ?? 0
  const occupiedBeds = beds?.filter((b) => b.status === 'occupied').length ?? 0
  const vacantBeds = beds?.filter((b) => b.status === 'vacant').length ?? 0
  const reservedBeds = beds?.filter((b) => b.status === 'reserved').length ?? 0

  return {
    totalFloors: hotel.floors?.length ?? 0,
    totalRooms: rooms?.length ?? 0,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    reservedBeds,
    /** occupied + vacant + reserved should equal totalBeds */
    bedBreakdownValid: occupiedBeds + vacantBeds + reservedBeds === totalBeds,
    totalCustomers: customers?.list?.length ?? 0,
    totalBookings: bookings?.list?.length ?? 0,
    pendingPayments: bookings?.list?.reduce((sum, b) => sum + (b.balanceAmount || 0), 0) ?? 0,
    todayCheckIns: bookings?.list?.filter((b) =>
      (b.checkInDateTime || b.checkInDate || b.createdAt || '').startsWith(today),
    ).length ?? 0,
    todayCheckOuts: bookings?.list?.filter((b) =>
      (b.checkOutDateTime || '').startsWith(today),
    ).length ?? 0,
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
