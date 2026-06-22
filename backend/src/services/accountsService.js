import { query } from '../config/db.js'

const normalizeType = (type) => (type || 'Cash').toLowerCase()

const addToBucket = (bucket, type, amount) => {
  const t = normalizeType(type)
  const amt = Number(amount) || 0
  if (t.includes('cash')) bucket.cash += amt
  else if (t.includes('upi')) bucket.upi += amt
  else if (t.includes('card')) bucket.card += amt
  else bucket.bank += amt
  bucket.total += amt
}

const aggregateRows = (rows) => {
  const map = { cash: 0, upi: 0, card: 0, bank: 0, total: 0 }
  rows.forEach(({ type, total }) => addToBucket(map, type, total))
  return map
}

const mergePeriodRows = (bookingPayments, monthlyPayments, extendedPayments = []) => {
  const periods = new Map()

  const ensure = (period) => {
    const key = String(period)
    if (!periods.has(key)) {
      periods.set(key, { period: key, cash: 0, upi: 0, card: 0, bank: 0, total: 0 })
    }
    return periods.get(key)
  }

  ;[...bookingPayments, ...monthlyPayments, ...extendedPayments].forEach(({ period, type, total }) => {
    if (!period) return
    const row = ensure(period)
    addToBucket(row, type, total)
  })

  return [...periods.values()]
    .sort((a, b) => String(b.period).localeCompare(String(a.period)))
    .map((row, i) => ({ id: row.period || `row-${i}`, ...row }))
}

export const getAccountsSummary = async ({ view = 'day', date } = {}) => {
  const periodExpr = view === 'month'
    ? "DATE_FORMAT(payment_date, '%Y-%m')"
    : 'DATE(payment_date)'

  const bookingRevenueSql = date
    ? (view === 'month'
      ? `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period, payment_type AS type, SUM(amount) AS total
         FROM booking_payments WHERE DATE_FORMAT(payment_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY period, payment_type`
      : `SELECT DATE(payment_date) AS period, payment_type AS type, SUM(amount) AS total
         FROM booking_payments WHERE DATE(payment_date) = ?
         GROUP BY period, payment_type`)
    : `SELECT ${periodExpr} AS period, payment_type AS type, SUM(amount) AS total
       FROM booking_payments WHERE payment_date IS NOT NULL
       GROUP BY period, payment_type`

  const monthlyRevenueSql = date
    ? (view === 'month'
      ? `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period, COALESCE(payment_mode, 'Cash') AS type, SUM(amount_paid) AS total
         FROM monthly_payments WHERE status = 'paid' AND DATE_FORMAT(payment_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY period, type`
      : `SELECT DATE(payment_date) AS period, COALESCE(payment_mode, 'Cash') AS type, SUM(amount_paid) AS total
         FROM monthly_payments WHERE status = 'paid' AND DATE(payment_date) = ?
         GROUP BY period, type`)
    : `SELECT ${view === 'month' ? "DATE_FORMAT(payment_date, '%Y-%m')" : 'DATE(payment_date)'} AS period,
              COALESCE(payment_mode, 'Cash') AS type, SUM(amount_paid) AS total
       FROM monthly_payments WHERE status = 'paid' AND payment_date IS NOT NULL
       GROUP BY period, type`

  const extendedRevenueSql = date
    ? (view === 'month'
      ? `SELECT DATE_FORMAT(extended_payment_date, '%Y-%m') AS period,
                COALESCE(extended_payment_type, 'Cash') AS type, SUM(extended_amount) AS total
         FROM bookings WHERE extended_amount > 0 AND extended_payment_date IS NOT NULL
           AND DATE_FORMAT(extended_payment_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY period, type`
      : `SELECT DATE(extended_payment_date) AS period,
                COALESCE(extended_payment_type, 'Cash') AS type, SUM(extended_amount) AS total
         FROM bookings WHERE extended_amount > 0 AND extended_payment_date IS NOT NULL
           AND DATE(extended_payment_date) = ?
         GROUP BY period, type`)
    : `SELECT ${view === 'month' ? "DATE_FORMAT(extended_payment_date, '%Y-%m')" : 'DATE(extended_payment_date)'} AS period,
              COALESCE(extended_payment_type, 'Cash') AS type, SUM(extended_amount) AS total
       FROM bookings WHERE extended_amount > 0 AND extended_payment_date IS NOT NULL
       GROUP BY period, type`

  const params = date ? [date] : []

  const [bookingResult, monthlyResult, extendedResult] = await Promise.all([
    query(bookingRevenueSql, params),
    query(monthlyRevenueSql, params),
    query(extendedRevenueSql, params),
  ])

  const bookingPayments = bookingResult[0]
  const monthlyPayments = monthlyResult[0]
  const extendedPayments = extendedResult[0]

  const rows = mergePeriodRows(bookingPayments, monthlyPayments, extendedPayments)
  const bookingAgg = aggregateRows(bookingPayments)
  const monthlyAgg = aggregateRows(monthlyPayments)
  const extendedAgg = aggregateRows(extendedPayments)

  const totalRevenue = bookingAgg.total + monthlyAgg.total + extendedAgg.total

  const expenseSql = date
    ? (view === 'month'
      ? `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE DATE_FORMAT(expense_date,'%Y-%m')=DATE_FORMAT(?,'%Y-%m')`
      : `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_date = ?`)
    : `SELECT COALESCE(SUM(amount),0) AS total FROM expenses`

  const [[expenseRow]] = await query(expenseSql, params)
  const totalExpenses = Number(expenseRow.total)
  const netProfit = totalRevenue - totalExpenses

  const [[pendingRow]] = await query(`
    SELECT COALESCE(SUM(GREATEST(monthly_rent - COALESCE(amount_paid, 0), 0)), 0)
      + (SELECT COALESCE(SUM(balance_amount), 0) FROM bookings WHERE balance_amount > 0) AS pending
    FROM monthly_payments WHERE status IN ('pending', 'partial')
  `)

  return {
    cards: {
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingAmount: Number(pendingRow.pending),
    },
    rows,
    totalAmount: totalRevenue,
    profitLoss: { totalRevenue, totalExpenses, netProfit },
  }
}

export const getProfitLossReport = async ({ year } = {}) => {
  const y = year || new Date().getFullYear()

  const [monthlyRevenue] = await query(`
    SELECT MONTH(payment_date) AS month, SUM(amount_paid) AS revenue
    FROM monthly_payments WHERE status='paid' AND YEAR(payment_date)=?
    GROUP BY MONTH(payment_date)
  `, [y])

  const [bookingRevenue] = await query(`
    SELECT MONTH(payment_date) AS month, SUM(amount) AS revenue
    FROM booking_payments WHERE YEAR(payment_date)=?
    GROUP BY MONTH(payment_date)
  `, [y])

  const [monthlyExpenses] = await query(`
    SELECT MONTH(expense_date) AS month, SUM(amount) AS expenses
    FROM expenses WHERE YEAR(expense_date)=?
    GROUP BY MONTH(expense_date)
  `, [y])

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const rev = Number(monthlyRevenue.find((r) => r.month === m)?.revenue || 0)
      + Number(bookingRevenue.find((r) => r.month === m)?.revenue || 0)
    const exp = Number(monthlyExpenses.find((r) => r.month === m)?.expenses || 0)
    return { month: m, revenue: rev, expenses: exp, profit: rev - exp }
  })

  return months
}
