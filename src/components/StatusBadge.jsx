import { Chip } from '@mui/material'
import { getStatusBadge } from '../utils/helpers'

const StatusBadge = ({ status, label }) => {
  const badge = getStatusBadge(status)
  return (
    <Chip
      label={label || badge.label}
      size="small"
      className={`${badge.className} border font-medium capitalize`}
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  )
}

export default StatusBadge
