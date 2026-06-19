import { Box } from '@mui/material'
import { formatDate, formatTime } from '../utils/helpers'

const DateTimeStack = ({ value }) => {
  if (!value) return '—'

  return (
    <Box sx={{ lineHeight: 1.3, py: 0.25 }}>
      <Box sx={{ fontSize: '0.8125rem', color: '#334155' }}>{formatDate(value)}</Box>
      <Box sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{formatTime(value)}</Box>
    </Box>
  )
}

export default DateTimeStack
