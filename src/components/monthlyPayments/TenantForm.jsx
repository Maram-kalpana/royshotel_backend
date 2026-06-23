import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material'
import dayjs from 'dayjs'
import { formatCurrency, isValidImageUrl } from '../../utils/helpers'
import { fieldSx, primaryButtonSx, drawerFormStackSx, amountFieldSx, drawerSectionSx } from '../../utils/layout'
import DateTimeSplitField, { combineDateAndTime, splitDateTime } from '../DateTimeSplitField'
import DatePickerField from '../DatePickerField'
import FileUpload from '../FileUpload'

const selectMenuProps = {
  disablePortal: true,
  PaperProps: { sx: { maxHeight: 280 } },
}

const paymentTypes = ['Cash', 'UPI', 'Card', 'Bank Transfer']

const emptyDefaults = () => {
  const now = dayjs()
  return {
    name: '', phone: '', address: '', city: '', state: '',
    aadhaar: '', pan: '', floorId: '', roomId: '', bedId: '',
    advancePaid: '',
    monthlyRent: '', dueDay: '',
    checkInDate: now.format('YYYY-MM-DD'),
    checkInTime: now.format('HH:mm'),
    checkOutDate: '',
    checkOutTime: '',
    paymentDate: now.format('YYYY-MM-DD'),
    paymentType: 'Cash',
    paymentStatus: 'pending',
  }
}

/** Build form defaults from tenant + linked customer/booking — API: GET /monthly-payments/:id */
export const buildTenantFormDefaults = (tenant, customer, booking, beds = [], floors = []) => {
  if (!tenant) return emptyDefaults()

  const bedId = tenant.bedId || customer?.bedId || booking?.bedId || ''
  const bed = beds.find((b) => b.id === bedId)
  const floor = bed ? floors.find((f) => f.id === bed.floorId || f.number === bed.floorNumber) : null

  const checkIn = splitDateTime(tenant.checkInDateTime || booking?.checkInDateTime || customer?.checkInDate || tenant.checkInDate)
  const checkOut = splitDateTime(tenant.checkOutDateTime || booking?.checkOutDateTime || tenant.checkOutDate || customer?.checkOutDate || '')

  return {
    name: tenant.customerName || customer?.name || '',
    phone: tenant.phone || customer?.phone || '',
    address: tenant.address || customer?.address || '',
    city: tenant.city || customer?.city || '',
    state: tenant.state || customer?.state || '',
    aadhaar: tenant.aadhaar || customer?.aadhaar || '',
    pan: tenant.pan || customer?.pan || '',
    floorId: tenant.floorId || floor?.id || bed?.floorId || '',
    roomId: tenant.roomId || bed?.roomId || customer?.roomId || booking?.roomId || '',
    bedId,
    advancePaid: tenant.advancePaid ?? booking?.advancePaid ?? '',
    totalAmount: tenant.totalAmount ?? booking?.totalAmount ?? tenant.monthlyRent ?? '',
    monthlyRent: tenant.monthlyRent ?? '',
    dueDay: tenant.dueDay ?? 1,
    checkInDate: checkIn.date || dayjs().format('YYYY-MM-DD'),
    checkInTime: checkIn.time || dayjs().format('HH:mm'),
    checkOutDate: checkOut.date || '',
    checkOutTime: checkOut.time || '',
    paymentDate: tenant.advancePaidDate || tenant.paymentDate || booking?.paymentDate || dayjs().format('YYYY-MM-DD'),
    paymentType: tenant.paymentType || booking?.paymentType || 'Cash',
    paymentStatus: tenant.paymentStatus || booking?.paymentStatus || 'pending',
  }
}

const TenantForm = ({ floors, rooms, beds, onSubmit, onCancel, tenant, customer, booking, editMode = false }) => {
  const [photoFile, setPhotoFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null)

  const defaults = useMemo(
    () => buildTenantFormDefaults(tenant, customer, booking, beds, floors),
    [tenant, customer, booking, beds, floors],
  )

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({ defaultValues: defaults })

  useEffect(() => {
    reset(defaults)
    setPhotoFile(null)
    setAadhaarFile(null)
    setAadhaarBackFile(null)
  }, [defaults, reset, tenant?.id])

  const selectedFloor = watch('floorId')
  const selectedRoom = watch('roomId')
  const selectedBed = watch('bedId')
  const advancePaid = Number(watch('advancePaid')) || 0
  const monthlyRent = Number(watch('monthlyRent')) || 0
  const totalAmount = monthlyRent
  const checkInDate = watch('checkInDate')
  const checkInTime = watch('checkInTime')
  const checkOutDate = watch('checkOutDate')
  const checkOutTime = watch('checkOutTime')
  const currentBedId = tenant?.bedId || customer?.bedId || booking?.bedId

  const availableBeds = useMemo(() => {
    if (editMode && currentBedId) {
      return beds.filter((b) => b.status === 'vacant' || b.id === currentBedId)
    }
    return beds.filter((b) => b.status === 'vacant')
  }, [beds, editMode, currentBedId])

  const vacantFloors = useMemo(() => {
    const floorIds = new Set(availableBeds.map((b) => b.floorId))
    const floorNumbers = new Set(availableBeds.map((b) => b.floorNumber))
    return floors.filter((f) => floorIds.has(f.id) || floorNumbers.has(f.number))
  }, [floors, availableBeds])

  const vacantRooms = useMemo(() => {
    if (!selectedFloor) return []
    const selectedFloorData = floors.find((f) => f.id === selectedFloor)
    const roomIds = new Set(availableBeds.map((b) => b.roomId))
    return rooms.filter((r) => {
      if (!roomIds.has(r.id)) return false
      if (r.floorId === selectedFloor) return true
      if (selectedFloorData && r.floorNumber === selectedFloorData.number) return true
      return false
    })
  }, [rooms, availableBeds, selectedFloor, floors])

  const filteredBeds = useMemo(
    () => availableBeds.filter((b) => b.roomId === selectedRoom),
    [availableBeds, selectedRoom],
  )

  const selectedBedData = beds.find((b) => b.id === selectedBed)
  const balanceAmount = Math.max(0, totalAmount - (advancePaid || 0))

  useEffect(() => { if (!editMode) { setValue('roomId', ''); setValue('bedId', '') } }, [selectedFloor, setValue, editMode])
  useEffect(() => { if (!editMode) setValue('bedId', '') }, [selectedRoom, setValue, editMode])
  useEffect(() => {
    if (monthlyRent > 0) setValue('totalAmount', monthlyRent)
  }, [monthlyRent, setValue])

  const handleFormSubmit = (data) => {
    const advance = Number(data.advancePaid) || 0
    if (advance > 0 && !data.paymentDate) {
      return
    }

    const checkInDateTime = combineDateAndTime(data.checkInDate, data.checkInTime)
    const checkOutDateTime = data.checkOutDate
      ? combineDateAndTime(data.checkOutDate, data.checkOutTime || '12:00')
      : ''
    const rent = Number(data.monthlyRent) || 0
    
    const computedTotal = rent
    const computedBalance = Math.max(0, computedTotal - advance)

    onSubmit({
      ...data,
      stayType: 'Months',
      duration: 1,
      checkInDateTime,
      checkOutDateTime,
      bedCost: selectedBedData?.cost || rent,
      totalAmount: computedTotal,
      balanceAmount: computedBalance,
      monthlyRent: rent,
      advancePaid: advance,
      dueDay: Number(data.dueDay) || 1,
      paymentDate: data.paymentDate,
      securityDeposit: advance,
      photoFile,
      aadhaarFile,
      photo: photoFile?.preview
        || (isValidImageUrl(tenant?.photo) ? tenant.photo : null)
        || (isValidImageUrl(customer?.photo) ? customer.photo : null),
      aadhaarDoc: aadhaarFile?.preview || (isValidImageUrl(tenant?.aadhaarDoc) ? tenant.aadhaarDoc : null) || (isValidImageUrl(customer?.aadhaarDoc) ? customer.aadhaarDoc : null),
      aadhaarFront: aadhaarFile?.preview || (isValidImageUrl(tenant?.aadhaarFront) ? tenant.aadhaarFront : null) || (isValidImageUrl(customer?.aadhaarFront) ? customer.aadhaarFront : null),
      aadhaarBack: aadhaarBackFile?.preview || (isValidImageUrl(tenant?.aadhaarBack) ? tenant.aadhaarBack : null) || (isValidImageUrl(customer?.aadhaarBack) ? customer.aadhaarBack : null),
      paymentStatus: data.paymentStatus || (computedBalance > 0 ? 'pending' : 'completed'),
    })
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

      <Section title="Stay Information">
        <Controller name="floorId" control={control} rules={{ required: 'Select a floor' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Floor" error={!!errors.floorId} helperText={errors.floorId?.message} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
            {vacantFloors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="roomId" control={control} rules={{ required: 'Select a room' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Room" disabled={!selectedFloor} error={!!errors.roomId} helperText={errors.roomId?.message} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
            {vacantRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="bedId" control={control} rules={{ required: 'Select a bed' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Bed" disabled={!selectedRoom} error={!!errors.bedId} helperText={errors.bedId?.message} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
            {filteredBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber} — {formatCurrency(b.cost)}</MenuItem>)}
          </TextField>
        )} />
        <TextField label="Stay Type" value="Monthly" InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
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
        {editMode && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <DateTimeSplitField
              dateLabel="Check-Out Date"
              timeLabel="Check-Out Time"
              dateValue={checkOutDate}
              timeValue={checkOutTime}
              onDateChange={(v) => setValue('checkOutDate', v)}
              onTimeChange={(v) => setValue('checkOutTime', v)}
            />
          </Box>
        )}
      </Section>

      <Section title="Monthly Rent & Payment">
        <Controller name="monthlyRent" control={control} rules={{ required: 'Monthly rent is required', min: { value: 1, message: 'Enter valid rent' } }} render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="Monthly Rent (₹)"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            error={!!errors.monthlyRent}
            helperText={errors.monthlyRent?.message}
            sx={amountFieldSx}
            fullWidth
            inputProps={{ min: 0 }}
          />
        )} />
        <Controller name="advancePaid" control={control} render={({ field }) => (
          <TextField
            {...field}
            type="number"
            label="Advance (₹)"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            sx={amountFieldSx}
            fullWidth
            inputProps={{ min: 0 }}
          />
        )} />
        <Controller name="paymentDate" control={control} render={({ field: { value, onChange } }) => (
          <DatePickerField label="Advance Paid Date" value={value} onChange={onChange} sx={fieldSx} />
        )} />
        <Controller name="paymentType" control={control} rules={{ required: 'Payment type is required' }} render={({ field }) => (
          <TextField {...field} select label="Payment Type" error={!!errors.paymentType} sx={fieldSx} fullWidth>
            {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="paymentStatus" control={control} render={({ field }) => (
          <TextField {...field} select label="Payment Status" sx={fieldSx} fullWidth>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Paid</MenuItem>
          </TextField>
        )} />
      </Section>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button type="submit" variant="contained" sx={primaryButtonSx}>
          {editMode ? 'Update Tenant' : 'Save Tenant'}
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

export default TenantForm
