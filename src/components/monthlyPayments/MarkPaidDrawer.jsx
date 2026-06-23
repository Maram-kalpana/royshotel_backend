import { useState, useEffect } from 'react'
import { Button, TextField, MenuItem } from '@mui/material'
import DatePickerField from '../DatePickerField'
import { fieldSx, primaryButtonSx, amountFieldSx } from '../../utils/layout'
import { PAYMENT_MODES, formatMonthYear } from '../../utils/monthlyPaymentHelpers'

/** Right-side drawer form: POST /monthly-payments/:id/mark-paid */
const MarkPaidDrawer = ({ tenant, onSubmit, onCancel }) => {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')

  useEffect(() => {
    if (tenant) {
      setPaidDate(new Date().toISOString().split('T')[0])
      setAmount('')
      setPaymentMode('Cash')
    }
  }, [tenant?.id])

  const handleSubmit = () => {
    if (!paidDate || !amount || !paymentMode) return
    const month = formatMonthYear(paidDate)
    onSubmit({
      tenantId: tenant.id,
      month,
      amount: Number(amount),
      paymentMode,
      paidDate,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <DatePickerField label="Payment Date" value={paidDate} onChange={setPaidDate} sx={fieldSx} />
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
      <div className="flex gap-1.5 justify-end pt-2">
        <Button onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} sx={primaryButtonSx}>Confirm Payment</Button>
      </div>
    </div>
  )
}

export default MarkPaidDrawer
