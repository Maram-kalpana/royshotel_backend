import {
  Dialog, DialogContent, DialogTitle, IconButton, Typography, Box, Avatar, Grid, Divider,
} from '@mui/material'
import { X } from 'lucide-react'
import DrawerDetailItem from './DrawerDetailItem'
import PaymentStatusBadge from './PaymentStatusBadge'
import {
  formatCurrency, formatDate, formatDateTime, formatStayDuration, getImageSrc,
} from '../utils/helpers'

const Section = ({ title, children }) => (
  <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fafbfc' }}>
    <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1.5, color: '#0f172a' }}>
      {title}
    </Typography>
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Box>
)

const Detail = ({ label, value }) => (
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <DrawerDetailItem label={label} value={value ?? '—'} />
  </Grid>
)

// Reusable document image cell
const DocImage = ({ label, src, alt }) => (
  <Grid size={{ xs: 12, sm: 4 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    {src
      ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', mt: 0.5, borderRadius: 1, border: '1px solid #e2e8f0', bgcolor: '#000' }}
        />
      )
      : <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>—</Typography>}
  </Grid>
)

const BookingViewModal = ({ open, onClose, booking, customer }) => {
  if (!booking) return null

  // Resolve images — field may live on `customer` or directly on `booking`
  // depending on how your backend stores/returns data.
  const photo      = getImageSrc(customer?.photo      || booking?.photo)
  const aadhaarDoc = getImageSrc(customer?.aadhaarDoc || customer?.aadhaarFront || booking?.aadhaarDoc)
  const aadhaarBack = getImageSrc(customer?.aadhaarBack || booking?.aadhaarBack)

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Booking Details</Typography>
          <Typography variant="body2" color="text.secondary">{booking.customerName}</Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1200, mx: 'auto' }}>

          <Section title="Customer Information">
            <Detail label="Full Name" value={booking.customerName} />
            <Detail label="Phone" value={booking.phone || customer?.phone} />
            <Detail label="Email" value={customer?.email} />
            <Detail label="Address" value={customer?.address} />
            <Detail label="City" value={customer?.city} />
            <Detail label="State" value={customer?.state} />
          </Section>

          <Section title="Identity Information">
            <Detail label="Aadhaar Number" value={customer?.aadhaar} />
            <Detail label="PAN Number" value={customer?.pan} />
            {/* Documents — use base64 strings saved at booking time */}
            <DocImage label="Photo"          src={photo}       alt="Customer photo" />
            <DocImage label="Aadhaar Front"  src={aadhaarDoc}  alt="Aadhaar front" />
            <DocImage label="Aadhaar Back"   src={aadhaarBack} alt="Aadhaar back" />
          </Section>

          <Section title="Booking Info">
            <Detail label="Floor"       value={booking.floorNumber} />
            <Detail label="Room"        value={booking.roomNumber} />
            <Detail label="Bed"         value={booking.bedNumber} />
            <Detail label="Stay"        value={formatStayDuration(booking.duration, booking.stayType)} />
            <Detail label="Check-In"    value={formatDateTime(booking.checkInDateTime || booking.checkInDate)} />
            <Detail label="Check-Out"   value={booking.checkOutDateTime ? formatDateTime(booking.checkOutDateTime) : '—'} />
          </Section>

          <Section title="Payment Info">
            <Detail label="Total Amount"   value={formatCurrency(booking.totalAmount)} />
            <Detail label="Advance Paid"   value={formatCurrency(booking.advancePaid)} />
            <Detail label="Balance"        value={formatCurrency(booking.balanceAmount)} />
            <Detail label="Payment Type"   value={booking.paymentType || '—'} />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">Payment Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <PaymentStatusBadge status={booking.paymentStatus} balanceAmount={booking.balanceAmount} />
              </Box>
            </Grid>
          </Section>

          {booking.extendedUpto && (
            <Section title="Extension Details">
              <Detail label="Extended Upto"         value={formatDateTime(booking.extendedUpto)} />
              <Detail label="Extension Amount"      value={formatCurrency(booking.extendedAmount)} />
              <Detail label="Extension Status"      value={booking.extendedStatus || '—'} />
              <Detail label="Extension Payment Type" value={booking.extendedPaymentType || '—'} />
              <Detail label="Amount Paid Date"      value={booking.extendedPaymentDate ? formatDate(booking.extendedPaymentDate) : '—'} />
            </Section>
          )}

          {booking.shifts?.length > 0 && (
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fafbfc' }}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1.5 }}>Room Shift History</Typography>
              {booking.shifts.map((shift, idx) => (
                <Box key={idx} sx={{ p: 2, mb: 1.5, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#fff' }}>
                  <Grid container spacing={2}>
                    <Detail label="From (Floor / Room / Bed)" value={`${shift.oldFloorNumber} / ${shift.oldRoomNumber} / ${shift.oldBedNumber}`} />
                    <Detail label="To (Floor / Room / Bed)"   value={`${shift.newFloorNumber} / ${shift.newRoomNumber} / ${shift.newBedNumber}`} />
                    <Detail label="Shift Date"                value={formatDate(shift.shiftDate)} />
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default BookingViewModal