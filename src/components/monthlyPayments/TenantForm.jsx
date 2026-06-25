import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material'
import dayjs from 'dayjs'
import { formatCurrency } from '../../utils/helpers'
import { fileStateFromUrl, resolveImageForSubmit } from '../../utils/fileHelpers'
import { getVacantFloors, getVacantRooms, getVacantBedsForRoom, filterVacantBeds, enrichBedsWithRooms, normId } from '../../utils/vacancyHelpers'
import { fieldSx, primaryButtonSx, drawerFormStackSx, amountFieldSx, drawerSectionSx, drawerSelectMenuProps } from '../../utils/layout'
import DateTimeSplitField, { combineDateAndTime, splitDateTime } from '../DateTimeSplitField'
import DatePickerField from '../DatePickerField'
import FileUpload from '../FileUpload'

const selectMenuProps = drawerSelectMenuProps

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
    shiftDate: now.format('YYYY-MM-DD'),
    newFloorId: '',
    newRoomId: '',
    newBedId: '',
  }
}

/** Build form defaults from tenant + linked customer/booking — API: GET /monthly-payments/:id */
export const buildTenantFormDefaults = (tenant, customer, booking, beds = [], floors = []) => {
  if (!tenant) return emptyDefaults()

  const bedId = tenant.bedId || customer?.bedId || booking?.bedId || ''
  const bed = beds.find((b) => String(b.id) === String(bedId))
  const floor = bed ? floors.find((f) => String(f.id) === String(bed.floorId) || Number(f.number) === Number(bed.floorNumber)) : null

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
    shiftDate: dayjs().format('YYYY-MM-DD'),
    newFloorId: '',
    newRoomId: '',
    newBedId: '',
  }
}

const TenantForm = ({ floors, rooms, beds, onSubmit, onCancel, tenant, customer, booking, editMode = false, loading = false }) => {
  const [photoFile, setPhotoFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const defaults = useMemo(
    () => buildTenantFormDefaults(tenant, customer, booking, beds, floors),
    [tenant, customer, booking, beds, floors],
  )

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({ defaultValues: defaults })

  useEffect(() => {
    reset(defaults)
    const src = customer || tenant
    setPhotoFile(fileStateFromUrl(src?.photo, 'photo.jpg'))
    setAadhaarFile(fileStateFromUrl(src?.aadhaarFront || src?.aadhaarDoc, 'aadhaar-front.jpg'))
    setAadhaarBackFile(fileStateFromUrl(src?.aadhaarBack, 'aadhaar-back.jpg'))
  }, [defaults, reset, tenant?.id, customer?.id])

  const selectedFloor = watch('floorId')
  const selectedRoom = watch('roomId')
  const selectedBed = watch('bedId')
  const newFloorId = watch('newFloorId')
  const newRoomId = watch('newRoomId')
  const monthlyRent = Number(watch('monthlyRent')) || 0
  const checkInDate = watch('checkInDate')
  const checkInTime = watch('checkInTime')
  const checkOutDate = watch('checkOutDate')
  const checkOutTime = watch('checkOutTime')
  const currentBedId = tenant?.bedId || customer?.bedId || booking?.bedId

  const enrichedBeds = useMemo(() => enrichBedsWithRooms(beds, rooms), [beds, rooms])

  const availableBeds = useMemo(() => {
    const vacant = filterVacantBeds(enrichedBeds)
    if (editMode && currentBedId) {
      const current = enrichedBeds.find((b) => String(b.id) === String(currentBedId))
      if (current && !vacant.some((b) => String(b.id) === String(currentBedId))) {
        return [...vacant, current]
      }
    }
    return vacant
  }, [enrichedBeds, editMode, currentBedId])

  const vacantFloors = useMemo(
    () => getVacantFloors(floors, availableBeds, rooms),
    [floors, availableBeds, rooms],
  )

  const vacantRooms = useMemo(
    () => getVacantRooms(rooms, availableBeds, floors, selectedFloor),
    [rooms, availableBeds, floors, selectedFloor],
  )

  const filteredBeds = useMemo(
    () => getVacantBedsForRoom(availableBeds, selectedRoom, rooms),
    [availableBeds, selectedRoom, rooms],
  )

  const shiftRooms = useMemo(
    () => getVacantRooms(rooms, availableBeds, floors, newFloorId),
    [rooms, availableBeds, floors, newFloorId],
  )

  const shiftBeds = useMemo(
    () => getVacantBedsForRoom(availableBeds, newRoomId, rooms),
    [availableBeds, newRoomId, rooms],
  )

  const currentBed = enrichedBeds.find((b) => String(b.id) === String(currentBedId))
  const selectedBedData = enrichedBeds.find((b) => String(b.id) === String(selectedBed))

  useEffect(() => {
    if (!import.meta.env.DEV) return
    console.log('floors', floors)
    console.log('rooms', rooms)
    console.log('beds', beds)
    console.log('vacantBedsList', availableBeds)
    console.log('vacantFloors', vacantFloors)
    console.log('vacantRooms', vacantRooms)
    console.log('filteredBeds', filteredBeds)
    console.log('selectedFloor', selectedFloor)
    console.log('selectedRoom', selectedRoom)
    console.log('selectedBed', selectedBed)
  }, [floors, rooms, beds, availableBeds, vacantFloors, vacantRooms, filteredBeds, selectedFloor, selectedRoom, selectedBed])

  useEffect(() => { if (!editMode) { setValue('roomId', ''); setValue('bedId', '') } }, [selectedFloor, setValue, editMode])
  useEffect(() => { if (!editMode) setValue('bedId', '') }, [selectedRoom, setValue, editMode])
  useEffect(() => {
    if (monthlyRent > 0) setValue('totalAmount', monthlyRent)
  }, [monthlyRent, setValue])

  const handleFormSubmit = async (data) => {
    const advance = Number(data.advancePaid) || 0
    if (advance > 0 && !data.paymentDate) {
      return
    }

    if (!editMode) {
      if (!data.floorId || !data.roomId || !data.bedId) return
      const bed = enrichedBeds.find((b) => String(b.id) === String(data.bedId))
      if (!bed || !filterVacantBeds([bed]).length) return
    }

    const checkInDateTime = combineDateAndTime(data.checkInDate, data.checkInTime)
    const checkOutDateTime = data.checkOutDate
      ? combineDateAndTime(data.checkOutDate, data.checkOutTime || '12:00')
      : null
    const rent = Number(data.monthlyRent) || 0

    const src = customer || tenant
    setSubmitting(true)
    try {
      const [photo, aadhaarFront, aadhaarBack] = await Promise.all([
        resolveImageForSubmit(photoFile, src?.photo, 'photo'),
        resolveImageForSubmit(aadhaarFile, src?.aadhaarFront || src?.aadhaarDoc, 'aadhaarFront'),
        resolveImageForSubmit(aadhaarBackFile, src?.aadhaarBack, 'aadhaarBack'),
      ])

      console.log('Submitting Data:', data)
      console.log('Images:', { photo, aadhaarFront, aadhaarBack })

      await onSubmit({
        ...data,
        stayType: 'Months',
        duration: 1,
        checkInDateTime,
        checkOutDateTime,
        bedCost: selectedBedData?.cost || currentBed?.cost || rent,
        totalAmount: rent,
        balanceAmount: rent,
        monthlyRent: rent,
        advancePaid: advance,
        dueDay: Number(data.dueDay) || 1,
        paymentDate: data.paymentDate,
        securityDeposit: advance,
        bedId: data.newBedId || data.bedId || currentBedId,
        newFloorId: data.newFloorId || '',
        newRoomId: data.newRoomId || '',
        newBedId: data.newBedId || '',
        shiftDate: data.shiftDate || '',
        photo,
        aadhaarDoc: aadhaarFront,
        aadhaarFront,
        aadhaarBack,
        paymentStatus: 'pending',
      })
    } catch (err) {
      console.error('Tenant submit error:', err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, maxWidth: '100%', width: '100%' }}>
      {!editMode && loading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          Loading available beds...
        </Typography>
      )}
      {!editMode && !loading && filterVacantBeds(enrichedBeds).length === 0 && (
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

      <Section title="Stay Information">
        {editMode ? (
          <>
            <TextField label="Floor" value={currentBed ? floors.find((f) => String(f.id) === String(currentBed.floorId))?.name || `Floor ${currentBed.floorNumber}` : '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
            <TextField label="Room" value={currentBed?.roomNumber ? `Room ${currentBed.roomNumber}` : '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
            <TextField label="Bed" value={currentBed ? `Bed ${currentBed.bedNumber}` : '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
          </>
        ) : (
          <>
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
                SelectProps={{ MenuProps: selectMenuProps }}
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
                SelectProps={{ MenuProps: selectMenuProps }}
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
                  Bed {selectedBedData.bedNumber} · {selectedBedData.bedType || 'Standard'} · {formatCurrency(selectedBedData.cost)}/month
                </Typography>
              </Box>
            )}
          </>
        )}
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

      {editMode && (
        <Section title="Room Shift">
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', gridColumn: '1 / -1' }}>Current Location</Typography>
          <TextField label="Old Floor" value={currentBed?.floorNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
          <TextField label="Old Room" value={currentBed?.roomNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
          <TextField label="Old Bed" value={currentBed?.bedNumber ?? '—'} InputProps={{ readOnly: true }} sx={fieldSx} fullWidth />
          <Controller name="shiftDate" control={control} render={({ field: { value, onChange } }) => (
            <DatePickerField label="Shift Date" value={value} onChange={onChange} sx={{ gridColumn: '1 / -1' }} />
          )} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', gridColumn: '1 / -1', mt: 0.5 }}>New Location</Typography>
          <Controller name="newFloorId" control={control} render={({ field }) => (
            <TextField {...field} select fullWidth label="New Floor" onChange={(e) => { field.onChange(e); setValue('newRoomId', ''); setValue('newBedId', '') }} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
              <MenuItem value="">Select floor</MenuItem>
              {vacantFloors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="newRoomId" control={control} render={({ field }) => (
            <TextField {...field} select fullWidth label="New Room" disabled={!newFloorId} onChange={(e) => { field.onChange(e); setValue('newBedId', '') }} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
              <MenuItem value="">Select room</MenuItem>
              {shiftRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
            </TextField>
          )} />
          <Controller name="newBedId" control={control} render={({ field }) => (
            <TextField {...field} select fullWidth label="New Bed" disabled={!newRoomId} sx={fieldSx} SelectProps={{ MenuProps: selectMenuProps }}>
              <MenuItem value="">Select bed</MenuItem>
              {shiftBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber} — {formatCurrency(b.cost)}</MenuItem>)}
            </TextField>
          )} />
        </Section>
      )}

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
            label="Advance / Security Deposit (₹)"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            helperText="Separate from monthly rent — not deducted from rent due"
            sx={amountFieldSx}
            fullWidth
            inputProps={{ min: 0 }}
          />
        )} />
        <Controller name="paymentDate" control={control} render={({ field: { value, onChange } }) => (
          <DatePickerField label="Advance Paid Date" value={value} onChange={onChange} sx={fieldSx} />
        )} />
        <Controller name="paymentType" control={control} render={({ field }) => (
          <TextField {...field} select label="Advance Payment Type" sx={fieldSx} fullWidth>
            {paymentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        )} />
      </Section>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button type="submit" variant="contained" sx={primaryButtonSx} disabled={submitting || (!editMode && (loading || filterVacantBeds(enrichedBeds).length === 0))}>
          {submitting ? 'Saving...' : editMode ? 'Update Tenant' : 'Save Tenant'}
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
