import { TextField, MenuItem } from '@mui/material'
import { fieldSx, drawerSelectMenuProps } from '../utils/layout'

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'completed',
}

const OPTIONS = [
  { value: PAYMENT_STATUS.PENDING, label: 'Pending', color: '#ea580c' },
  { value: PAYMENT_STATUS.PAID, label: 'Paid', color: '#15803d' },
]

const resolveOption = (value) =>
  OPTIONS.find((o) => o.value === value) || OPTIONS[0]

const menuProps = drawerSelectMenuProps

/** Paid / Pending dropdown with green (Paid) and orange (Pending) styling */
const PaymentStatusSelect = ({ label, value, onChange, sx = {}, size = 'small' }) => {
  const selected = resolveOption(value || PAYMENT_STATUS.PENDING)

  return (
    <TextField
      select
      fullWidth
      size={size}
      label={label}
      value={value || PAYMENT_STATUS.PENDING}
      onChange={onChange}
      sx={{
        ...fieldSx,
        ...sx,
        '& .MuiSelect-select': { color: selected.color, fontWeight: 600 },
      }}
      SelectProps={{
        MenuProps: menuProps,
        renderValue: (v) => resolveOption(v).label,
      }}
    >
      {OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value} sx={{ color: opt.color, fontWeight: 600 }}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default PaymentStatusSelect
