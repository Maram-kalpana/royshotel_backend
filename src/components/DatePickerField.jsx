import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { fieldSx } from '../utils/layout'

const popperSx = { zIndex: 1600 }

const DatePickerField = ({ label, value, onChange, sx = {}, disabled = false }) => (
  <DatePicker
    label={label}
    value={value ? dayjs(value) : null}
    disabled={disabled}
    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    slotProps={{
      popper: { sx: popperSx, placement: 'bottom-start' },
      mobilePaper: { sx: popperSx },
      desktopPaper: { sx: popperSx },
      textField: {
        fullWidth: true,
        size: 'small',
        sx: { ...fieldSx, ...sx },
      },
    }}
  />
)

export default DatePickerField
