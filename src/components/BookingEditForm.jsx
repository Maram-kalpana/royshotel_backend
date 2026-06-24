import { useMemo } from 'react'
import { TextField, MenuItem, Typography, Box } from '@mui/material'
import DatePickerField from './DatePickerField'
import DateTimeSplitField, { splitDateTime } from './DateTimeSplitField'
import PaymentStatusSelect from './PaymentStatusSelect'
import { formatCurrency } from '../utils/helpers'
import { fieldSx, drawerFormStackSx, amountFieldSx, drawerSectionSx } from '../utils/layout'

const paymentTypes = ['Cash', 'UPI', 'Card', 'Bank Transfer']
const selectMenuProps = { sx: { zIndex: 1600 }, PaperProps: { sx: { maxHeight: 280 } } }

const Section = ({ title, children }) => (
  <Box sx={{ ...drawerSectionSx }}>
    <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1, color: '#0f172a', fontSize: '0.8125rem' }}>{title}</Typography>
    <Box sx={drawerFormStackSx}>{children}</Box>
  </Box>
)

const BookingEditForm = ({
  booking,
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
  const extended = splitDateTime(booking.extendedUpto || '')
  const balanceAmount = Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.advancePaid) || 0))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Section title="Customer Information">
        <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => onChange({ name: e.target.value })} sx={fieldSx} size="small" />
        <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} sx={fieldSx} size="small" />
        <TextField fullWidth label="Address" value={form.address} onChange={(e) => onChange({ address: e.target.value })} sx={fieldSx} size="small" />
        <TextField fullWidth label="City" value={form.city} onChange={(e) => onChange({ city: e.target.value })} sx={fieldSx} size="small" />
        <TextField fullWidth label="State" value={form.state} onChange={(e) => onChange({ state: e.target.value })} sx={fieldSx} size="small" />
      </Section>

      <Section title="Identity Information">
        <TextField fullWidth label="Aadhaar Number" value={form.aadhaar} onChange={(e) => onChange({ aadhaar: e.target.value })} sx={fieldSx} size="small" />
        <TextField fullWidth label="PAN Number" value={form.pan} onChange={(e) => onChange({ pan: e.target.value })} sx={fieldSx} size="small" />
      </Section>

      <Section title="Booking Information">
        <TextField label="Floor" value={booking.floorNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Room" value={booking.roomNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Bed" value={booking.bedNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Duration" value={booking.duration ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Stay Type" value={booking.stayType ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Check-In Date" value={checkIn.date || '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
        <TextField label="Check-In Time" value={checkIn.time || '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" fullWidth />
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
        <TextField
          fullWidth
          type="number"
          label="Total Amount"
          value={form.totalAmount}
          onChange={(e) => onChange({ totalAmount: e.target.value })}
          sx={amountFieldSx}
          size="small"
        />
        <TextField
          fullWidth
          type="number"
          label="Advance"
          value={form.advancePaid}
          onChange={(e) => onChange({ advancePaid: e.target.value })}
          sx={amountFieldSx}
          size="small"
        />
        <TextField select fullWidth label="Advance Payment Type" value={form.advancePaymentType} onChange={(e) => onChange({ advancePaymentType: e.target.value })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
          {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <DatePickerField
          label="Advance Payment Date"
          value={form.advancePaymentDate}
          onChange={(v) => onChange({ advancePaymentDate: v })}
        />
        <PaymentStatusSelect
          label="Advance Payment Status"
          value={form.advancePaymentStatus || form.paymentStatus || 'pending'}
          onChange={(e) => onChange({ advancePaymentStatus: e.target.value, paymentStatus: e.target.value })}
        />

        <TextField
          fullWidth
          label="Balance"
          value={formatCurrency(balanceAmount)}
          InputProps={{ readOnly: true }}
          sx={{ ...fieldSx, '& input': { fontWeight: 600, color: balanceAmount > 0 ? '#ea580c' : '#15803d' } }}
          size="small"
        />
        {balanceAmount > 0 && (
          <>
            <TextField select fullWidth label="Balance Payment Type" value={form.balancePaymentType} onChange={(e) => onChange({ balancePaymentType: e.target.value })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
              {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <DatePickerField label="Balance Payment Date" value={form.balancePaymentDate} onChange={(v) => onChange({ balancePaymentDate: v })} />
            <PaymentStatusSelect
              label="Balance Payment Status"
              value={form.balancePaymentStatus || (form.balancePaymentDate ? 'completed' : 'pending')}
              onChange={(e) => onChange({
                balancePaymentStatus: e.target.value,
                paymentStatus: e.target.value === 'completed' ? 'completed' : form.paymentStatus,
              })}
            />
          </>
        )}
      </Section>

      <Section title="Extend Stay">
        <DateTimeSplitField
          dateLabel="Extended Upto Date"
          timeLabel="Extended Upto Time"
          dateValue={form.extendedDate || extended.date}
          timeValue={form.extendedTime || extended.time || '12:00'}
          onDateChange={(v) => onChange({ extendedDate: v })}
          onTimeChange={(v) => onChange({ extendedTime: v })}
        />
        <TextField fullWidth type="number" label="Extension Amount" value={form.extendedAmount} onChange={(e) => onChange({ extendedAmount: e.target.value })} sx={amountFieldSx} size="small" />
        <TextField select fullWidth label="Extension Payment Type" value={form.extendedPaymentType} onChange={(e) => onChange({ extendedPaymentType: e.target.value })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
          {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <PaymentStatusSelect
          label="Extension Payment Status"
          value={form.extendedStatus === 'completed' ? 'completed' : 'pending'}
          onChange={(e) => onChange({ extendedStatus: e.target.value })}
        />
        <DatePickerField
          label="Extension Paid Date"
          value={form.extendedPaymentDate}
          onChange={(v) => onChange({ extendedPaymentDate: v })}
        />
      </Section>

      <Section title="Room Shift">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', gridColumn: '1 / -1' }}>Current Location</Typography>
        <TextField fullWidth label="Old Floor" value={booking.floorNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" />
        <TextField fullWidth label="Old Room" value={booking.roomNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" />
        <TextField fullWidth label="Old Bed" value={booking.bedNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} size="small" />
        <DatePickerField label="Shift Date" value={form.shiftDate} onChange={(v) => onChange({ shiftDate: v })} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', gridColumn: '1 / -1', mt: 0.5 }}>New Location</Typography>
        <TextField select fullWidth label="New Floor" value={form.newFloorId} onChange={(e) => onChange({ newFloorId: e.target.value, newRoomId: '', newBedId: '' })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
          <MenuItem value="">Select floor</MenuItem>
          {vacantFloors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="New Room" value={form.newRoomId} disabled={!form.newFloorId} onChange={(e) => onChange({ newRoomId: e.target.value, newBedId: '' })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
          <MenuItem value="">Select room</MenuItem>
          {shiftRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="New Bed" value={form.newBedId} disabled={!form.newRoomId} onChange={(e) => onChange({ newBedId: e.target.value })} sx={fieldSx} size="small" SelectProps={{ MenuProps: selectMenuProps }}>
          <MenuItem value="">Select bed</MenuItem>
          {shiftBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber}</MenuItem>)}
        </TextField>
      </Section>
    </Box>
  )
}

export default BookingEditForm
