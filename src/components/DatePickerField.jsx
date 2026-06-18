import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { fieldSx } from '../utils/layout'

const DatePickerField = ({ label, value, onChange, sx = {} }) => (
  <DatePicker
    label={label}
    value={value ? dayjs(value) : null}
    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    slotProps={{
      textField: {
        fullWidth: true,
        size: 'small',
        sx: { ...fieldSx, ...sx },
      },
    }}
  />
)

export default DatePickerField
