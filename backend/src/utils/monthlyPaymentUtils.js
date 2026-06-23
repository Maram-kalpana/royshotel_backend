export const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer']

export const MODES_REQUIRING_TXN = ['UPI', 'Card', 'Bank Transfer']

export const computePaymentStatus = (totalRent, totalPaid) => {
  const rent = Number(totalRent) || 0
  const paid = Number(totalPaid) || 0
  if (paid <= 0) return 'pending'
  if (paid >= rent) return 'paid'
  return 'partial'
}

export const validateSplitPayments = (payments, balanceRemaining) => {
  if (!Array.isArray(payments) || payments.length === 0) {
    throw Object.assign(new Error('At least one payment is required'), { status: 400 })
  }

  let batchTotal = 0
  for (const p of payments) {
    const amount = Number(p.amount)
    if (!amount || amount <= 0) {
      throw Object.assign(new Error('Payment amount must be greater than zero'), { status: 400 })
    }
    batchTotal += amount

    if (!PAYMENT_MODES.includes(p.paymentMode)) {
      throw Object.assign(new Error(`Invalid payment mode: ${p.paymentMode}`), { status: 400 })
    }

    if (MODES_REQUIRING_TXN.includes(p.paymentMode) && !String(p.transactionId || '').trim()) {
      throw Object.assign(
        new Error(`Transaction ID is required for ${p.paymentMode} payments`),
        { status: 400 },
      )
    }
  }

  if (batchTotal > balanceRemaining + 0.001) {
    throw Object.assign(
      new Error(`Payment total ₹${batchTotal} exceeds remaining balance ₹${balanceRemaining}`),
      { status: 400 },
    )
  }

  return batchTotal
}

export const parseMonthYear = (monthLabel) => {
  const d = new Date(`${monthLabel} 1`)
  if (Number.isNaN(d.getTime())) {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear(), monthLabel }
  }
  return {
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    monthLabel,
  }
}
