import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material'
import dayjs from 'dayjs'
import { formatCurrency, parseDurationInput } from '../utils/helpers'
import { fieldSx, primaryButtonSx, drawerFormStackSx, amountFieldSx, drawerSectionSx } from '../utils/layout'
import DateTimeSplitField, { combineDateAndTime } from './DateTimeSplitField'
import DatePickerField from './DatePickerField'
import FileUpload from './FileUpload'

const selectMenuProps = {
  disablePortal: true,
  PaperProps: { sx: { maxHeight: 280 } },
}

const paymentTypes = ['Cash', 'UPI', 'Card', 'Bank Transfer']

const rowSx = { display: 'flex', gap: 1.5, width: '100%', flexWrap: { xs: 'wrap', sm: 'nowrap' } }
const thirdFieldSx = { ...fieldSx, flex: 1, minWidth: { xs: '100%', sm: 0 } }

const BookingForm = ({ floors, rooms, beds, onSubmit, onCancel }) => {
  const [photoFile, setPhotoFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null)

  const now = dayjs()
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '', phone: '', address: '', city: '', state: '',
      aadhaar: '', pan: '', floorId: '', roomId: '', bedId: '',
      stayType: 'Days', duration: '', advancePaid: '', totalAmount: '',
      checkInDate: now.format('YYYY-MM-DD'),
      checkInTime: now.format('HH:mm'),
      checkOutDate: '',
      checkOutTime: '',
      advancePaymentType: 'Cash',
      advancePaymentDate: now.format('YYYY-MM-DD'),
      balancePaymentType: 'Cash',
      balancePaymentDate: '',
      paymentStatus: 'pending',
      balancePaymentStatus: 'pending',
    },
  })

  const selectedFloor = watch('floorId')
  const selectedRoom = watch('roomId')
  const selectedBed = watch('bedId')
  const durationRaw = watch('duration')
  const { duration, stayType: parsedStayType } = parseDurationInput(durationRaw)
  const advancePaid = Number(watch('advancePaid')) || 0
  const totalAmount = Number(watch('totalAmount')) || 0
  const paymentStatus = watch('paymentStatus')
  const checkInDate = watch('checkInDate')
  const checkInTime = watch('checkInTime')

  const vacantBedsList = useMemo(() => beds.filter((b) => b.status === 'vacant'), [beds])

  const vacantFloors = useMemo(() => {
    const floorIds = new Set(vacantBedsList.map((b) => b.floorId))
    const floorNumbers = new Set(vacantBedsList.map((b) => b.floorNumber))
    return floors.filter((f) => floorIds.has(f.id) || floorNumbers.has(f.number))
  }, [floors, vacantBedsList])

  const vacantRooms = useMemo(() => {
    if (!selectedFloor) return []
    const selectedFloorData = floors.find((f) => f.id === selectedFloor)
    const roomIds = new Set(vacantBedsList.map((b) => b.roomId))
    return rooms.filter((r) => {
      if (!roomIds.has(r.id)) return false
      if (r.floorId === selectedFloor) return true
      if (selectedFloorData && r.floorNumber === selectedFloorData.number) return true
      return false
    })
  }, [rooms, vacantBedsList, selectedFloor, floors])

  const filteredBeds = useMemo(
    () => vacantBedsList.filter((b) => b.roomId === selectedRoom),
    [vacantBedsList, selectedRoom],
  )

  const selectedBedData = beds.find((b) => b.id === selectedBed)
  const balanceAmount = Math.max(0, totalAmount - (advancePaid || 0))

  useEffect(() => { setValue('roomId', ''); setValue('bedId', '') }, [selectedFloor, setValue])
  useEffect(() => { setValue('bedId', '') }, [selectedRoom, setValue])
  useEffect(() => {
    if (selectedBedData && duration) {
      setValue('totalAmount', selectedBedData.cost * (duration || 0))
    }
  }, [selectedBed, duration, selectedBedData, setValue])
  useEffect(() => {
    if (balanceAmount <= 0 && totalAmount > 0) setValue('paymentStatus', 'completed')
    else if (balanceAmount > 0) setValue('paymentStatus', 'pending')
  }, [balanceAmount, totalAmount, setValue])

  const handleFormSubmit = (data) => {
    const checkInDateTime = combineDateAndTime(data.checkInDate, data.checkInTime)

    onSubmit({
      ...data,
      stayType: parsedStayType,
      duration: duration || 1,
      durationLabel: parseDurationInput(data.duration).label,
      checkInDateTime,
      checkOutDateTime: null,
      bedCost: selectedBedData?.cost || 0,
      totalAmount,
      balanceAmount,
      advancePaymentDate: combineDateAndTime(data.advancePaymentDate, data.checkInTime),
      balancePaymentDate: data.balancePaymentDate
        ? combineDateAndTime(data.balancePaymentDate, data.checkInTime)
        : '',
      photoFile,
      aadhaarFile,
      photo: photoFile?.preview || null,
      aadhaarFront: aadhaarFile?.preview || null,
      aadhaarBack: aadhaarBackFile?.preview || null,
      aadhaarDoc: aadhaarFile?.preview || null,
      paymentStatus: balanceAmount > 0
        ? (data.balancePaymentStatus === 'completed' ? 'completed' : 'pending')
        : (data.paymentStatus === 'completed' ? 'completed' : 'pending'),
    })
    reset()
    setPhotoFile(null); setAadhaarFile(null); setAadhaarBackFile(null)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Section title="Customer Information">
        <Field control={control} name="name" label="Full Name" rules={{ required: 'Name is required' }} errors={errors} />
        <Field control={control} name="phone" label="Phone Number" rules={{ required: 'Phone is required' }} errors={errors} />
        <Field control={control} name="address" label="Address" rules={{ required: 'Address is required' }} errors={errors} />
        <Field control={control} name="city" label="City" rules={{ required: 'City is required' }} errors={errors} />
        <Field control={control} name="state" label="State" rules={{ required: 'State is required' }} errors={errors} />
      </Section>

      <Section title="Identity Information">
        <Field control={control} name="aadhaar" label="Aadhaar Number" rules={{ required: 'Aadhaar is required', minLength: { value: 12, message: 'Must be 12 digits' } }} errors={errors} />
        <Field control={control} name="pan" label="PAN Number" rules={{ required: 'PAN is required' }} errors={errors} />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FileUpload label="Photo" value={photoFile} onChange={setPhotoFile} accept="image/*" />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FileUpload label="Aadhaar Front" value={aadhaarFile} onChange={setAadhaarFile} accept="image/*" />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FileUpload label="Aadhaar Back" value={aadhaarBackFile} onChange={setAadhaarBackFile} accept="image/*" />
        </Box>
      </Section>

      <Section title="Booking Information">
        <Controller name="floorId" control={control} rules={{ required: 'Select a floor' }} render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label="Floor"
            error={!!errors.floorId}
            helperText={errors.floorId?.message || (vacantFloors.length === 0 ? 'No floors with vacant beds' : '')}
            sx={fieldSx}
            SelectProps={{ MenuProps: selectMenuProps }}
          >
            {vacantFloors.length === 0
              ? <MenuItem value="" disabled>No vacant floors available</MenuItem>
              : vacantFloors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="roomId" control={control} rules={{ required: 'Select a room' }} render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label="Room"
            disabled={!selectedFloor}
            error={!!errors.roomId}
            helperText={
              errors.roomId?.message
              || (!selectedFloor ? 'Select a floor first' : vacantRooms.length === 0 ? 'No vacant rooms on this floor' : '')
            }
            sx={fieldSx}
            SelectProps={{ MenuProps: selectMenuProps }}
          >
            {vacantRooms.length === 0
              ? <MenuItem value="" disabled>No vacant rooms available</MenuItem>
              : vacantRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="bedId" control={control} rules={{ required: 'Select a bed' }} render={({ field }) => (
          <TextField
            {...field}
            select
            fullWidth
            label="Bed"
            disabled={!selectedRoom}
            error={!!errors.bedId}
            helperText={
              errors.bedId?.message
              || (!selectedRoom ? 'Select a room first' : filteredBeds.length === 0 ? 'No vacant beds in this room' : '')
            }
            sx={fieldSx}
            SelectProps={{ MenuProps: selectMenuProps }}
          >
            {filteredBeds.length === 0
              ? <MenuItem value="" disabled>No vacant beds available</MenuItem>
              : filteredBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber} — {formatCurrency(b.cost)}</MenuItem>)}
          </TextField>
        )} />
        <Box sx={rowSx}>
          <Controller name="duration" control={control} rules={{ required: 'Duration is required' }} render={({ field }) => (
            <TextField
              {...field}
              label="Duration"
              placeholder="e.g. 3 Days, 2 Weeks"
              error={!!errors.duration}
              helperText={errors.duration?.message}
              sx={{ ...amountFieldSx, flex: 1 }}
            />
          )} />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <DateTimeSplitField
            dateLabel="Check-In Date"
            timeLabel="Check-In Time"
            dateValue={checkInDate}
            timeValue={checkInTime}
            onDateChange={(v) => setValue('checkInDate', v, { shouldValidate: true })}
            onTimeChange={(v) => setValue('checkInTime', v)}
            required
          />
        </Box>
      </Section>

      <Section title="Payment Information">
        <Controller name="totalAmount" control={control} rules={{ required: true, min: 0 }} render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="Total Amount"
            onChange={(e) => field.onChange(Number(e.target.value))}
            sx={amountFieldSx}
          />
        )} />

        <Box sx={rowSx}>
          <Controller name="advancePaid" control={control} render={({ field }) => (
            <TextField {...field} type="number" label="Advance" onChange={(e) => field.onChange(Number(e.target.value))} sx={thirdFieldSx} />
          )} />
          <Controller name="advancePaymentType" control={control} render={({ field }) => (
            <TextField {...field} select label="Advance Payment Type" sx={thirdFieldSx}>
              {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="advancePaymentDate" control={control} render={({ field: { value, onChange } }) => (
            <DatePickerField label="Advance Payment Date" value={value} onChange={onChange} sx={thirdFieldSx} />
          )} />
        </Box>
        <Controller name="paymentStatus" control={control} render={({ field }) => (
          <TextField {...field} select label="Advance Payment Status" sx={{ ...fieldSx, gridColumn: '1 / -1' }}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Paid</MenuItem>
          </TextField>
        )} />

        <Box sx={rowSx}>
          <TextField
            label="Balance"
            value={formatCurrency(balanceAmount)}
            InputProps={{ readOnly: true }}
            sx={{ ...thirdFieldSx, '& input': { fontWeight: 600, color: balanceAmount > 0 ? '#c2410c' : '#15803d' } }}
          />
          {balanceAmount > 0 && (
            <>
              <Controller name="balancePaymentType" control={control} render={({ field }) => (
                <TextField {...field} select label="Balance Payment Type" sx={thirdFieldSx}>
                  {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              )} />
              <Controller name="balancePaymentDate" control={control} render={({ field: { value, onChange } }) => (
                <DatePickerField label="Balance Payment Date" value={value} onChange={onChange} sx={thirdFieldSx} />
              )} />
              <Controller name="balancePaymentStatus" control={control} render={({ field }) => (
                <TextField {...field} select label="Balance Payment Status" sx={thirdFieldSx}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Paid</MenuItem>
                </TextField>
              )} />
            </>
          )}
        </Box>
      </Section>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button type="submit" variant="contained" sx={primaryButtonSx}>Save Booking</Button>
      </Box>
    </Box>
  )
}

const Section = ({ title, children }) => (
  <Box sx={{ ...drawerSectionSx }}>
    <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1, color: '#0f172a', fontSize: '0.8125rem' }}>{title}</Typography>
    <Box sx={drawerFormStackSx}>{children}</Box>
  </Box>
)

const Field = ({ control, name, label, rules, errors, type = 'text' }) => (
  <Controller name={name} control={control} rules={rules} render={({ field }) => (
    <TextField {...field} label={label} type={type} fullWidth error={!!errors[name]} helperText={errors[name]?.message} sx={fieldSx} />
  )} />
)

export default BookingForm
