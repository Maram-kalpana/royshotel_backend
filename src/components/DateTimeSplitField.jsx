import { TextField, Box } from '@mui/material'
import DatePickerField from './DatePickerField'
import { fieldSx } from '../utils/layout'

const timeFieldSx = {
  ...fieldSx,
  width: '100%',
}

/** Stacked date picker + time field — works in narrow drawers */
const DateTimeSplitField = ({
  dateLabel,
  timeLabel,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  required,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', gridColumn: '1 / -1' }}>
    <DatePickerField
      label={dateLabel}
      value={dateValue}
      onChange={onDateChange}
    />
    <TextField
      type="time"
      label={timeLabel}
      value={timeValue || ''}
      required={required}
      onChange={(e) => onTimeChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={timeFieldSx}
      size="small"
      fullWidth
    />
  </Box>
)

export const combineDateAndTime = (date, time) => {
  if (!date) return ''
  const t = time || '00:00'
  return new Date(`${date}T${t}`).toISOString()
}

export const splitDateTime = (iso) => {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const [datePart] = iso.split('T')
    return { date: datePart || iso, time: '12:00' }
  }
  const date = d.toISOString().split('T')[0]
  const time = d.toTimeString().slice(0, 5)
  return { date, time }
}

export default DateTimeSplitField
