import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { fieldSx } from '../utils/layout'

const DatePickerField = ({ label, value, onChange, sx = {}, disabled = false }) => (
  <DatePicker
    label={label}
    value={value ? dayjs(value) : null}
    disabled={disabled}
    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    desktopModeMediaQuery="(min-width: 0px)"
    slotProps={{
      popper: { sx: { zIndex: 1600 }, placement: 'bottom-start' },
      desktopPaper: {
        sx: {
          zIndex: 1600,
          '& .MuiDateCalendar-root': {
            width: 260,
            height: 280,
          },
          '& .MuiPickersDay-root': {
            width: 28,
            height: 28,
            fontSize: '0.75rem',
          },
          '& .MuiDayCalendar-weekDayLabel': {
            width: 28,
            height: 28,
            fontSize: '0.7rem',
          },
          '& .MuiPickersCalendarHeader-root': {
            paddingLeft: '12px',
            paddingRight: '8px',
            minHeight: 32,
          },
          '& .MuiPickersCalendarHeader-label': {
            fontSize: '0.95rem',
          },
        },
      },
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