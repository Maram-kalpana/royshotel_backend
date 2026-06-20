import { query } from '../config/db.js'

export const getAccountsSummary = async ({ view = 'day', date } = {}) => {
  const filterDate = date || new Date().toISOString().split('T')[0]

  // Revenue from booking payments + advance
  const bookingRevenueSql = view === 'month'
    ? `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period,
              payment_type AS type, SUM(amount) AS total
       FROM booking_payments
       WHERE DATE_FORMAT(payment_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
       GROUP BY period, payment_type`
    : `SELECT DATE(payment_date) AS period,
              payment_type AS type, SUM(amount) AS total
       FROM booking_payments
       WHERE DATE(payment_date) = ?
       GROUP BY period, payment_type`

  const [bookingPayments] = await query(bookingRevenueSql, [filterDate])

  const monthlyRevenueSql = view === 'month'
    ? `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS period,
              COALESCE(payment_mode, 'Cash') AS type, SUM(amount_paid) AS total
       FROM monthly_payments
       WHERE status = 'paid' AND DATE_FORMAT(payment_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
       GROUP BY period, type`
    : `SELECT DATE(payment_date) AS period,
              COALESCE(payment_mode, 'Cash') AS type, SUM(amount_paid) AS total
       FROM monthly_payments
       WHERE status = 'paid' AND DATE(payment_date) = ?
       GROUP BY period, type`

  const [monthlyPayments] = await query(monthlyRevenueSql, [filterDate])

  const aggregate = (rows) => {
    const map = { cash: 0, upi: 0, card: 0, bank: 0, total: 0 }
    rows.forEach(({ type, total }) => {
      const t = (type || 'Cash').toLowerCase()
      const amt = Number(total)
      if (t.includes('cash')) map.cash += amt
      else if (t.includes('upi')) map.upi += amt
      else if (t.includes('card')) map.card += amt
      else map.bank += amt
      map.total += amt
    })
    return map
  }

  const bookingAgg = aggregate(bookingPayments)
  const monthlyAgg = aggregate(monthlyPayments)

  const totalRevenue = bookingAgg.total + monthlyAgg.total
  const [[expenseRow]] = await query(
    view === 'month'
      ? `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE DATE_FORMAT(expense_date,'%Y-%m')=DATE_FORMAT(?,'%Y-%m')`
      : `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_date = ?`,
    [filterDate],
  )
  const totalExpenses = Number(expenseRow.total)
  const netProfit = totalRevenue - totalExpenses

  const [[pendingRow]] = await query(`
    SELECT COALESCE(SUM(pending_amount),0) + (SELECT COALESCE(SUM(balance_amount),0) FROM bookings WHERE balance_amount > 0) AS pending
  `)

  return {
    cards: {
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingAmount: Number(pendingRow.pending),
    },
    rows: [{
      period: filterDate,
      cash: bookingAgg.cash + monthlyAgg.cash,
      upi: bookingAgg.upi + monthlyAgg.upi,
      card: bookingAgg.card + monthlyAgg.card,
      bank: bookingAgg.bank + monthlyAgg.bank,
      total: totalRevenue,
    }],
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
