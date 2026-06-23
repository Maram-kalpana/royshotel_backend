import { useState, useEffect, useMemo } from 'react'
import { Button, TextField, MenuItem, Typography, Box, IconButton } from '@mui/material'
import { Plus, Trash2 } from 'lucide-react'
import DatePickerField from '../DatePickerField'
import { fieldSx, primaryButtonSx, amountFieldSx } from '../../utils/layout'
import { formatCurrency } from '../../utils/helpers'
import {
  PAYMENT_MODES,
  MODES_REQUIRING_TXN,
  formatMonthYear,
} from '../../utils/monthlyPaymentHelpers'

const emptyRow = (date) => ({
  amount: '',
  paymentMode: 'Cash',
  transactionId: '',
  paymentDate: date,
  notes: '',
})

const SplitPaymentDrawer = ({ tenant, onSubmit, onCancel }) => {
  const today = new Date().toISOString().split('T')[0]
  const [paidDate, setPaidDate] = useState(today)
  const [rows, setRows] = useState([emptyRow(today)])
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [error, setError] = useState('')

  const monthRent = tenant?.monthlyRent ?? 0
  const monthLabel = formatMonthYear(paidDate)

  const existingRecord = useMemo(
    () => tenant?.paymentHistory?.find((p) => p.month === monthLabel),
    [tenant, monthLabel],
  )

  const alreadyPaid = existingRecord?.totalPaid ?? 0
  const balanceBefore = Math.max(0, monthRent - alreadyPaid)

  useEffect(() => {
    if (tenant) {
      setPaidDate(today)
      setRows([emptyRow(today)])
      setPaymentStatus('paid')
      setError('')
    }
  }, [tenant?.id])

  useEffect(() => {
    setRows((prev) => prev.map((r) => ({ ...r, paymentDate: paidDate })))
  }, [paidDate])

  const batchTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const updateRow = (index, patch) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
    setError('')
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow(paidDate)])
  const removeRow = (index) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const payments = rows
      .filter((r) => Number(r.amount) > 0)
      .map((r) => ({
        amount: Number(r.amount),
        paymentMode: r.paymentMode,
        transactionId: r.transactionId?.trim() || '',
        paymentDate: r.paymentDate || paidDate,
        notes: r.notes?.trim() || '',
      }))

    if (!payments.length) {
      setError('Enter at least one payment amount')
      return
    }

    for (const p of payments) {
      if (MODES_REQUIRING_TXN.includes(p.paymentMode) && !p.transactionId) {
        setError(`Transaction ID required for ${p.paymentMode}`)
        return
      }
    }

    if (batchTotal > balanceBefore + 0.001) {
      setError(`Total ₹${batchTotal} exceeds balance ₹${balanceBefore}`)
      return
    }

    if (paymentStatus === 'paid' && batchTotal < balanceBefore - 0.001) {
      setError(`Mark as Paid requires full balance of ₹${balanceBefore}`)
      return
    }

    onSubmit({
      tenantId: tenant.id,
      month: monthLabel,
      payments,
      paymentStatus,
    })
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1, border: '1px solid #bae6fd' }}>
        <Typography variant="body2" sx={{ color: '#0369a1', fontWeight: 600 }}>
          Month Rent: {formatCurrency(monthRent)}
        </Typography>
        {alreadyPaid > 0 && (
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            Already paid: {formatCurrency(alreadyPaid)} · Balance: {formatCurrency(balanceBefore)}
          </Typography>
        )}
      </Box>

      <DatePickerField label="Payment Date" value={paidDate} onChange={setPaidDate} sx={fieldSx} />

      <TextField select label="Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} sx={fieldSx} fullWidth>
        <MenuItem value="paid">Paid</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
      </TextField>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem' }}>Payments</Typography>

      {rows.map((row, index) => (
        <Box key={index} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#fafbfc' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField label="Amount" type="number" value={row.amount} onChange={(e) => updateRow(index, { amount: e.target.value })} sx={{ ...amountFieldSx, flex: 1 }} inputProps={{ min: 0 }} />
            <TextField select label="Mode" value={row.paymentMode} onChange={(e) => updateRow(index, { paymentMode: e.target.value })} sx={{ ...fieldSx, flex: 1 }}>
              {PAYMENT_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            {rows.length > 1 && (
              <IconButton size="small" color="error" onClick={() => removeRow(index)} sx={{ mt: 1 }}><Trash2 size={16} /></IconButton>
            )}
          </Box>
          {MODES_REQUIRING_TXN.includes(row.paymentMode) && (
            <TextField label="Transaction ID" value={row.transactionId} onChange={(e) => updateRow(index, { transactionId: e.target.value })} sx={{ ...fieldSx, mt: 1.5, width: '100%' }} required />
          )}
        </Box>
      ))}

      <Button startIcon={<Plus size={16} />} onClick={addRow} sx={{ alignSelf: 'flex-start', fontSize: '0.8125rem' }}>
        Add Another Payment
      </Button>

      {error && <Typography variant="body2" color="error">{error}</Typography>}

      <div className="flex gap-1.5 justify-end pt-1">
        <Button onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} sx={primaryButtonSx}>Confirm Payment</Button>
      </div>
    </div>
  )
}

export default SplitPaymentDrawer
