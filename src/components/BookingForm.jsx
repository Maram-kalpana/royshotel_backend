import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material'
import dayjs from 'dayjs'
import { formatCurrency, parseDurationInput } from '../utils/helpers'
import { fileToBase64 } from '../utils/fileHelpers'
import { getVacantFloors, getVacantRooms, getVacantBedsForRoom, filterVacantBeds, enrichBedsWithRooms, normId } from '../utils/vacancyHelpers'
import { fieldSx, primaryButtonSx, drawerFormStackSx, amountFieldSx, drawerSectionSx, drawerSelectMenuProps } from '../utils/layout'
import DateTimeSplitField, { combineDateAndTime } from './DateTimeSplitField'
import DatePickerField from './DatePickerField'
import FileUpload from './FileUpload'
import PaymentStatusSelect from './PaymentStatusSelect'

const paymentTypes = ['Cash', 'UPI', 'Card', 'Bank Transfer']

const BookingForm = ({ floors, rooms, beds, onSubmit, onCancel, loading = false }) => {
  const [photoFile, setPhotoFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  const enrichedBeds = useMemo(() => enrichBedsWithRooms(beds, rooms), [beds, rooms])
  const vacantBedsList = useMemo(() => filterVacantBeds(enrichedBeds), [enrichedBeds])
  const vacantFloors = useMemo(
    () => getVacantFloors(floors, vacantBedsList, rooms),
    [floors, vacantBedsList, rooms],
  )
  const vacantRooms = useMemo(
    () => getVacantRooms(rooms, vacantBedsList, floors, selectedFloor),
    [rooms, vacantBedsList, floors, selectedFloor],
  )
  const filteredBeds = useMemo(
    () => getVacantBedsForRoom(vacantBedsList, selectedRoom, rooms),
    [vacantBedsList, selectedRoom, rooms],
  )

  const selectedBedData = enrichedBeds.find((b) => String(b.id) === String(selectedBed))
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

  const handleFormSubmit = async (data) => {
    if (!data.floorId || !data.roomId || !data.bedId) return
    if (!selectedBedData || !filterVacantBeds([selectedBedData]).length) return

    setSubmitting(true)
    try {
      // ── Convert files to Base64 so they survive page reloads and DB storage ──
      const [photoBase64, aadhaarFrontBase64, aadhaarBackBase64] = await Promise.all([
        fileToBase64(photoFile?.file ?? null),
        fileToBase64(aadhaarFile?.file ?? null),
        fileToBase64(aadhaarBackFile?.file ?? null),
      ])

      const checkInDateTime = combineDateAndTime(data.checkInDate, data.checkInTime)

      await onSubmit({
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
        // ── Persistent base64 image strings ──────────────────────────────────
        photo: photoBase64,           // used in BookingViewModal as customer.photo
        aadhaarDoc: aadhaarFrontBase64, // Aadhaar front — shown as customer.aadhaarDoc
        aadhaarBack: aadhaarBackBase64, // Aadhaar back  — shown as customer.aadhaarBack
        paymentStatus: balanceAmount > 0
          ? (data.balancePaymentStatus === 'completed' ? 'completed' : 'pending')
          : (data.paymentStatus === 'completed' ? 'completed' : 'pending'),
      })

      reset()
      setPhotoFile(null)
      setAadhaarFile(null)
      setAadhaarBackFile(null)
    } catch (err) {
      console.error('Booking submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, maxWidth: '100%', width: '100%' }}>
      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          Loading available beds...
        </Typography>
      )}
      {!loading && vacantBedsList.length === 0 && (
        <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 1 }}>
          No vacant beds available
        </Typography>
      )}

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
            SelectProps={{ MenuProps: drawerSelectMenuProps }}
          >
            {vacantFloors.length === 0
              ? <MenuItem value="" disabled>No vacant floors available</MenuItem>
              : [
                <MenuItem key="" value=""><em>Select floor</em></MenuItem>,
                ...vacantFloors.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name || `Floor ${f.number}`}</MenuItem>
                )),
              ]}
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
            SelectProps={{ MenuProps: drawerSelectMenuProps }}
          >
            {vacantRooms.length === 0
              ? <MenuItem value="" disabled>No vacant rooms available</MenuItem>
              : [
                <MenuItem key="" value=""><em>Select room</em></MenuItem>,
                ...vacantRooms.map((r) => (
                  <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>
                )),
              ]}
          </TextField>
        )} />
        <Controller name="bedId" control={control} rules={{
          required: 'Select a bed',
          validate: (value) => {
            const bed = enrichedBeds.find((b) => String(b.id) === String(value))
            if (!bed) return 'Select a bed'
            if (!filterVacantBeds([bed]).length) return 'Selected bed is already occupied'
            return true
          },
        }} render={({ field }) => (
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
            SelectProps={{ MenuProps: drawerSelectMenuProps }}
          >
            {filteredBeds.length === 0
              ? <MenuItem value="" disabled>No vacant beds available</MenuItem>
              : [
                <MenuItem key="" value=""><em>Select bed</em></MenuItem>,
                ...filteredBeds.map((b) => (
                  <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber} — {formatCurrency(b.cost)}</MenuItem>
                )),
              ]}
          </TextField>
        )} />
        {selectedBedData && (
          <Box sx={{ gridColumn: '1 / -1', p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Bed Details</Typography>
            <Typography variant="body2">
              Bed {selectedBedData.bedNumber} · {selectedBedData.bedType || 'Standard'} · {formatCurrency(selectedBedData.cost)}/night
            </Typography>
          </Box>
        )}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Controller name="duration" control={control} rules={{ required: 'Duration is required' }} render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Duration"
              placeholder="e.g. 3 Days, 2 Weeks"
              error={!!errors.duration}
              helperText={errors.duration?.message}
              sx={amountFieldSx}
              size="small"
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
            fullWidth
            type="number"
            label="Total Amount"
            onChange={(e) => field.onChange(Number(e.target.value))}
            sx={amountFieldSx}
            size="small"
          />
        )} />
        <Controller name="advancePaid" control={control} render={({ field }) => (
          <TextField {...field} fullWidth type="number" label="Advance" onChange={(e) => field.onChange(Number(e.target.value))} sx={amountFieldSx} size="small" />
        )} />
        <Controller name="advancePaymentType" control={control} render={({ field }) => (
          <TextField {...field} select fullWidth label="Advance Payment Type" sx={fieldSx} size="small" SelectProps={{ MenuProps: drawerSelectMenuProps }}>
            {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="advancePaymentDate" control={control} render={({ field: { value, onChange } }) => (
          <DatePickerField label="Advance Payment Date" value={value} onChange={onChange} />
        )} />
        <Controller name="paymentStatus" control={control} render={({ field }) => (
          <PaymentStatusSelect label="Advance Payment Status" value={field.value} onChange={field.onChange} />
        )} />
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
            <Controller name="balancePaymentType" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Balance Payment Type" sx={fieldSx} size="small" SelectProps={{ MenuProps: drawerSelectMenuProps }}>
                {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="balancePaymentDate" control={control} render={({ field: { value, onChange } }) => (
              <DatePickerField label="Balance Payment Date" value={value} onChange={onChange} />
            )} />
            <Controller name="balancePaymentStatus" control={control} render={({ field }) => (
              <PaymentStatusSelect label="Balance Payment Status" value={field.value} onChange={field.onChange} />
            )} />
          </>
        )}
      </Section>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          sx={primaryButtonSx}
          disabled={loading || submitting || vacantBedsList.length === 0}
        >
          {submitting ? 'Saving...' : 'Save Booking'}
        </Button>
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