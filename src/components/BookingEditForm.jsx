import { useMemo } from 'react'
import { TextField, MenuItem, Typography, Box } from '@mui/material'
import DatePickerField from './DatePickerField'
import DateTimeSplitField, { splitDateTime } from './DateTimeSplitField'
import PaymentStatusBadge from './PaymentStatusBadge'
import { formatCurrency, getPaymentStatus } from '../utils/helpers'
import { fieldSx, drawerFormStackSx, amountFieldSx } from '../utils/layout'

const paymentTypes = ['Cash', 'UPI', 'Card', 'Bank Transfer']
const rowSx = { display: 'flex', gap: 1.5, width: '100%', flexWrap: { xs: 'wrap', sm: 'nowrap' } }
const thirdFieldSx = { ...fieldSx, flex: 1, minWidth: { xs: '100%', sm: 0 } }

const Section = ({ title, children }) => (
  <Box sx={{ p: 2, border: '1px solid #e2e8f0', bgcolor: '#fafbfc', borderRadius: 1 }}>
    <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1.5, color: '#0f172a' }}>{title}</Typography>
    <Box sx={drawerFormStackSx}>{children}</Box>
  </Box>
)

const BookingEditForm = ({
  booking,
  customer,
  floors,
  rooms,
  beds,
  form,
  onChange,
}) => {
  const vacantBedsList = useMemo(() => beds.filter((b) => b.status === 'vacant'), [beds])

  const vacantFloors = useMemo(() => {
    const floorIds = new Set(vacantBedsList.map((b) => b.floorId))
    const floorNumbers = new Set(vacantBedsList.map((b) => b.floorNumber))
    return floors.filter((f) => floorIds.has(f.id) || floorNumbers.has(f.number))
  }, [floors, vacantBedsList])

  const shiftRooms = useMemo(() => {
    if (!form.newFloorId) return []
    const selectedFloorData = floors.find((f) => f.id === form.newFloorId)
    const roomIds = new Set(vacantBedsList.map((b) => b.roomId))
    return rooms.filter((r) => {
      if (!roomIds.has(r.id)) return false
      if (r.floorId === form.newFloorId) return true
      if (selectedFloorData && r.floorNumber === selectedFloorData.number) return true
      return false
    })
  }, [rooms, vacantBedsList, form.newFloorId, floors])

  const shiftBeds = useMemo(
    () => vacantBedsList.filter((b) => b.roomId === form.newRoomId),
    [vacantBedsList, form.newRoomId],
  )

  const checkIn = splitDateTime(booking.checkInDateTime || booking.checkInDate || '')
  const balanceAmount = Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.advancePaid) || 0))
  const paymentStatus = form.paymentStatus || getPaymentStatus(balanceAmount)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Section title="Customer Information">
        <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => onChange({ name: e.target.value })} sx={fieldSx} />
        <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} sx={fieldSx} />
        <TextField fullWidth label="Address" value={form.address} onChange={(e) => onChange({ address: e.target.value })} sx={fieldSx} />
        <Box sx={rowSx}>
          <TextField fullWidth label="City" value={form.city} onChange={(e) => onChange({ city: e.target.value })} sx={{ ...fieldSx, flex: 1 }} />
          <TextField fullWidth label="State" value={form.state} onChange={(e) => onChange({ state: e.target.value })} sx={{ ...fieldSx, flex: 1 }} />
        </Box>
      </Section>

      <Section title="Identity Information">
        <TextField fullWidth label="Aadhaar Number" value={form.aadhaar} onChange={(e) => onChange({ aadhaar: e.target.value })} sx={fieldSx} />
        <TextField fullWidth label="PAN Number" value={form.pan} onChange={(e) => onChange({ pan: e.target.value })} sx={fieldSx} />
      </Section>

      <Section title="Booking Information">
        <Box sx={rowSx}>
          <TextField label="Floor" value={booking.floorNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField label="Room" value={booking.roomNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField label="Bed" value={booking.bedNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
        </Box>
        <Box sx={rowSx}>
          <TextField label="Duration" value={booking.duration ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField label="Stay Type" value={booking.stayType ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
        </Box>
        <Box sx={rowSx}>
          <TextField label="Check-In Date" value={checkIn.date || '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField label="Check-In Time" value={checkIn.time || '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
        </Box>
        <DateTimeSplitField
          dateLabel="Check-Out Date"
          timeLabel="Check-Out Time"
          dateValue={form.checkOutDate}
          timeValue={form.checkOutTime}
          onDateChange={(v) => onChange({ checkOutDate: v })}
          onTimeChange={(v) => onChange({ checkOutTime: v })}
        />
      </Section>

      <Section title="Payment Information">
        <Box sx={rowSx}>
          <TextField
            fullWidth
            type="number"
            label="Total Amount"
            value={form.totalAmount}
            onChange={(e) => onChange({ totalAmount: e.target.value })}
            sx={{ ...amountFieldSx, flex: 1 }}
          />
        </Box>

        <Box sx={rowSx}>
          <TextField
            fullWidth
            type="number"
            label="Advance"
            value={form.advancePaid}
            onChange={(e) => onChange({ advancePaid: e.target.value })}
            sx={thirdFieldSx}
          />
          <TextField select fullWidth label="Advance Payment Type" value={form.advancePaymentType} onChange={(e) => onChange({ advancePaymentType: e.target.value })} sx={thirdFieldSx}>
            {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <DatePickerField
            label="Advance Payment Date"
            value={form.advancePaymentDate}
            onChange={(v) => onChange({ advancePaymentDate: v })}
            sx={thirdFieldSx}
          />
        </Box>

        <Box sx={rowSx}>
          <TextField
            fullWidth
            label="Balance"
            value={formatCurrency(balanceAmount)}
            InputProps={{ readOnly: true }}
            sx={{ ...thirdFieldSx, '& input': { fontWeight: 600, color: balanceAmount > 0 ? '#c2410c' : '#15803d' } }}
          />
          {balanceAmount > 0 && (
            <>
              <TextField select fullWidth label="Balance Payment Type" value={form.balancePaymentType} onChange={(e) => onChange({ balancePaymentType: e.target.value })} sx={thirdFieldSx}>
                {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <DatePickerField
                label="Balance Payment Date"
                value={form.balancePaymentDate}
                onChange={(v) => onChange({
                  balancePaymentDate: v,
                  paymentStatus: v ? 'completed' : 'pending',
                })}
                sx={thirdFieldSx}
              />
            </>
          )}
        </Box>

        {balanceAmount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>Payment Status:</Typography>
            <PaymentStatusBadge status={paymentStatus} balanceAmount={balanceAmount} />
          </Box>
        )}
      </Section>

      <Section title="Extend Stay">
        <DateTimeSplitField
          dateLabel="Extended Upto Date"
          timeLabel="Extended Upto Time"
          dateValue={form.extendedDate}
          timeValue={form.extendedTime}
          onDateChange={(v) => onChange({ extendedDate: v })}
          onTimeChange={(v) => onChange({ extendedTime: v })}
        />
        <Box sx={rowSx}>
          <TextField fullWidth type="number" label="Extension Amount" value={form.extendedAmount} onChange={(e) => onChange({ extendedAmount: e.target.value })} sx={{ ...fieldSx, flex: 1 }} />
          <TextField select fullWidth label="Extension Payment Type" value={form.extendedPaymentType} onChange={(e) => onChange({ extendedPaymentType: e.target.value })} sx={{ ...fieldSx, flex: 1 }}>
            {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Extension Status" value={form.extendedStatus} onChange={(e) => onChange({ extendedStatus: e.target.value })} sx={{ ...fieldSx, flex: 1 }}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </Box>
        <DatePickerField
          label="Amount Paid Date"
          value={form.extendedPaymentDate}
          onChange={(v) => onChange({ extendedPaymentDate: v })}
          sx={fieldSx}
        />
      </Section>

      <Section title="Room Shift">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Current Location (Old)</Typography>
        <Box sx={rowSx}>
          <TextField fullWidth label="Old Floor" value={booking.floorNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField fullWidth label="Old Room" value={booking.roomNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
          <TextField fullWidth label="Old Bed" value={booking.bedNumber ?? '—'} InputProps={{ readOnly: true }} sx={{ ...fieldSx, flex: 1 }} />
        </Box>
        <DatePickerField label="Shift Date" value={form.shiftDate} onChange={(v) => onChange({ shiftDate: v })} sx={fieldSx} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 1 }}>New Location</Typography>
        <TextField select fullWidth label="New Floor" value={form.newFloorId} onChange={(e) => onChange({ newFloorId: e.target.value, newRoomId: '', newBedId: '' })} sx={fieldSx}>
          <MenuItem value="">Select floor</MenuItem>
          {vacantFloors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="New Room" value={form.newRoomId} disabled={!form.newFloorId} onChange={(e) => onChange({ newRoomId: e.target.value, newBedId: '' })} sx={fieldSx}>
          <MenuItem value="">Select room</MenuItem>
          {shiftRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="New Bed" value={form.newBedId} disabled={!form.newRoomId} onChange={(e) => onChange({ newBedId: e.target.value })} sx={fieldSx}>
          <MenuItem value="">Select bed</MenuItem>
          {shiftBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber}</MenuItem>)}
        </TextField>
      </Section>

    </Box>
  )
}

export default BookingEditForm
