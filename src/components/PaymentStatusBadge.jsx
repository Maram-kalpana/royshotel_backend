import { Chip } from '@mui/material'
import { getPaymentStatusBadge, getPaymentStatus } from '../utils/helpers'

const statusColors = {
  completed: { bgcolor: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' },
  pending: { bgcolor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' },
}

const PaymentStatusBadge = ({ balanceAmount, status }) => {
  const paymentStatus = status || getPaymentStatus(balanceAmount)
  const badge = getPaymentStatusBadge(paymentStatus)
  const colors = statusColors[paymentStatus] || statusColors.pending

  return (
    <Chip
      label={badge.label}
      size="small"
      sx={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        height: 22,
        bgcolor: colors.bgcolor,
        color: colors.color,
        border: `1px solid ${colors.borderColor}`,
      }}
    />
  )
}

export default PaymentStatusBadge
