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
      popper: { sx: { zIndex: 1700 }, placement: 'bottom-start' },
      mobilePaper: { sx: { zIndex: 1700 } },
      desktopPaper: { sx: { zIndex: 1700 } },
      textField: {
        fullWidth: true,
        size: 'small',
        sx: {
          ...fieldSx,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          ...sx,
        },
      },
    }}
    sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
  />
)

export default DatePickerField
