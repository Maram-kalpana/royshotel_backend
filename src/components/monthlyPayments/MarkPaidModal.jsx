import { useState, useEffect } from 'react'
import { Button, TextField, MenuItem } from '@mui/material'
import Modal from '../Modal'
import { fieldSx, primaryButtonSx, amountFieldSx } from '../../utils/layout'
import { PAYMENT_MODES, getCurrentMonthYear } from '../../utils/monthlyPaymentHelpers'

/** API: POST /monthly-payments/:id/mark-paid */
const MarkPaidModal = ({ open, onClose, tenant, onSubmit }) => {
  const [month, setMonth] = useState(getCurrentMonthYear())
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')

  useEffect(() => {
    if (tenant && open) {
      setMonth(getCurrentMonthYear())
      setAmount('')
      setPaymentMode('Cash')
    }
  }, [tenant, open])

  const monthOptions = tenant?.paymentHistory?.map((p) => p.month) || [getCurrentMonthYear()]

  const handleSubmit = () => {
    if (!month || !amount || !paymentMode) return
    onSubmit({
      tenantId: tenant.id,
      month,
      amount: Number(amount),
      paymentMode,
      paidDate: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Mark Paid — ${tenant?.customerName || ''}`}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} sx={primaryButtonSx}>Confirm Payment</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        <TextField select label="Month" value={month} onChange={(e) => setMonth(e.target.value)} sx={fieldSx} fullWidth>
          {[...new Set([...monthOptions, getCurrentMonthYear()])].map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={amountFieldSx}
          fullWidth
          inputProps={{ min: 0 }}
        />
        <TextField select label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} sx={fieldSx} fullWidth>
          {PAYMENT_MODES.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
        </TextField>
      </div>
    </Modal>
  )
}

export default MarkPaidModal
