import { query } from '../config/db.js'

export const getDashboardStats = async () => {
  const [[bedStats]] = await query(`
    SELECT
      COUNT(*) AS totalBeds,
      SUM(status = 'occupied') AS occupiedBeds,
      SUM(status = 'vacant') AS vacantBeds,
      SUM(status = 'reserved') AS reservedBeds
    FROM beds
  `)

  const [[roomStats]] = await query(`
    SELECT COUNT(*) AS totalRooms FROM rooms
  `)

  const [[floorStats]] = await query(`
    SELECT COUNT(*) AS totalFloors FROM floors
  `)

  const [[customerStats]] = await query(`
    SELECT COUNT(*) AS totalCustomers FROM customers WHERE status = 'checked-in'
  `)

  const [[bookingStats]] = await query(`
    SELECT COUNT(*) AS activeBookings FROM bookings WHERE status IN ('active', 'reserved', 'booked')
  `)

  const [[pendingStats]] = await query(`
    SELECT COALESCE(SUM(balance_amount), 0) AS pendingPayments FROM bookings WHERE balance_amount > 0
  `)

  const today = new Date().toISOString().split('T')[0]
  const [[todayStats]] = await query(`
    SELECT
      SUM(check_in_date = ?) AS todayCheckIns,
      SUM(check_out_datetime IS NOT NULL AND DATE(check_out_datetime) = ?) AS todayCheckOuts
    FROM bookings
  `, [today, today])

  const [[expenseTotal]] = await query(`SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses`)

  const [[monthlyCollection]] = await query(`
    SELECT COALESCE(SUM(amount_paid), 0) AS monthlyCollections
    FROM monthly_payments
    WHERE status = 'paid' AND MONTH(due_date) = MONTH(CURRENT_DATE()) AND YEAR(due_date) = YEAR(CURRENT_DATE())
  `)

  const [[pendingRent]] = await query(`
    SELECT COALESCE(SUM(pending_amount), 0) AS pendingRentAmount
    FROM monthly_payments WHERE status IN ('pending', 'partial')
  `)

  return {
    totalFloors: Number(floorStats.totalFloors),
    totalRooms: Number(roomStats.totalRooms),
    totalBeds: Number(bedStats.totalBeds),
    occupiedBeds: Number(bedStats.occupiedBeds),
    vacantBeds: Number(bedStats.vacantBeds),
    reservedBeds: Number(bedStats.reservedBeds),
    totalCustomers: Number(customerStats.totalCustomers),
    activeBookings: Number(bookingStats.activeBookings),
    pendingPayments: Number(pendingStats.pendingPayments),
    todayCheckIns: Number(todayStats.todayCheckIns),
    todayCheckOuts: Number(todayStats.todayCheckOuts),
    totalExpenses: Number(expenseTotal.totalExpenses),
    monthlyCollections: Number(monthlyCollection.monthlyCollections),
    pendingRentAmount: Number(pendingRent.pendingRentAmount),
    revenue: Number(monthlyCollection.monthlyCollections) + Number(pendingStats.pendingPayments),
  }
}

export const getMonthlyPaymentStats = async () => {
  const [[stats]] = await query(`
    SELECT
      (SELECT COUNT(*) FROM monthly_tenants) AS monthlyTenants,
      (SELECT COUNT(*) FROM monthly_payments WHERE status IN ('pending','partial') AND due_date <= LAST_DAY(CURRENT_DATE())) AS pendingPayments,
      (SELECT COALESCE(SUM(amount_paid),0) FROM monthly_payments WHERE status='paid' AND MONTH(payment_date)=MONTH(CURRENT_DATE())) AS collectionThisMonth,
      (SELECT COALESCE(SUM(monthly_rent),0) FROM monthly_tenants) AS expectedCollection
  `)
  return {
    monthlyTenants: Number(stats.monthlyTenants),
    paymentsDue: Number(stats.pendingPayments),
    pendingPayments: Number(stats.pendingPayments),
    collectionThisMonth: Number(stats.collectionThisMonth),
    expectedCollection: Number(stats.expectedCollection),
  }
}

export const getVacancyStats = async () => {
  const [[stats]] = await query(`
    SELECT
      SUM(status = 'vacant') AS availableBeds,
      SUM(status = 'occupied') AS occupiedBeds,
      (SELECT COUNT(*) FROM rooms r WHERE NOT EXISTS (
        SELECT 1 FROM beds b WHERE b.room_id = r.id AND b.status != 'vacant'
      )) AS vacantRooms
    FROM beds
  `)
  return {
    availableBeds: Number(stats.availableBeds),
    occupiedBeds: Number(stats.occupiedBeds),
    vacantRooms: Number(stats.vacantRooms),
  }
}
