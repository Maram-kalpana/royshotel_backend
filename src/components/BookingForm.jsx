import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material'
import { useEffect } from 'react'
import { formatCurrency } from '../utils/helpers'
import { fieldSx, primaryButtonSx, drawerFormStackSx } from '../utils/layout'
import DrawerFormStack from './DrawerFormStack'
import FileUpload from './FileUpload'
import toast from 'react-hot-toast'

const stayTypes = ['Hours', 'Days', 'Weeks', 'Months']

const BookingForm = ({ floors, rooms, beds, onSubmit, onCancel }) => {
  const [photoFile, setPhotoFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [panFile, setPanFile] = useState(null)

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '', phone: '', address: '', city: '', state: '',
      aadhaar: '', pan: '', floorId: '', roomId: '', bedId: '',
      stayType: 'Days', duration: 1, advancePaid: 0,
    },
  })

  const selectedFloor = watch('floorId')
  const selectedRoom = watch('roomId')
  const selectedBed = watch('bedId')
  const duration = watch('duration')
  const advancePaid = watch('advancePaid')

  const filteredRooms = rooms.filter((r) => r.floorId === selectedFloor)
  const filteredBeds = beds.filter((b) => b.roomId === selectedRoom && b.status === 'vacant')
  const selectedBedData = beds.find((b) => b.id === selectedBed)
  const bedCost = selectedBedData?.cost || 0
  const totalAmount = bedCost * (duration || 0)
  const balanceAmount = totalAmount - (advancePaid || 0)

  useEffect(() => { setValue('roomId', ''); setValue('bedId', '') }, [selectedFloor, setValue])
  useEffect(() => { setValue('bedId', '') }, [selectedRoom, setValue])

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data, bedCost, totalAmount, balanceAmount, photoFile, aadhaarFile, panFile,
      photo: photoFile?.preview || `https://i.pravatar.cc/150?u=${data.name}`,
    })
    toast.success('Booking created successfully!')
    reset()
    setPhotoFile(null); setAadhaarFile(null); setPanFile(null)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        <FileUpload label="Photo Upload" value={photoFile} onChange={setPhotoFile} />
        <FileUpload label="Aadhaar Upload" value={aadhaarFile} onChange={setAadhaarFile} />
        <FileUpload label="PAN Upload" value={panFile} onChange={setPanFile} />
      </Section>

      <Section title="Booking Information">
        <Controller name="floorId" control={control} rules={{ required: 'Select a floor' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Floor" error={!!errors.floorId} helperText={errors.floorId?.message} sx={fieldSx}>
            {floors.map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="roomId" control={control} rules={{ required: 'Select a room' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Room" disabled={!selectedFloor} error={!!errors.roomId} helperText={errors.roomId?.message} sx={fieldSx}>
            {filteredRooms.map((r) => <MenuItem key={r.id} value={r.id}>Room {r.roomNumber}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="bedId" control={control} rules={{ required: 'Select a bed' }} render={({ field }) => (
          <TextField {...field} select fullWidth label="Bed" disabled={!selectedRoom} error={!!errors.bedId} helperText={errors.bedId?.message} InputLabelProps={{ shrink: true }} sx={fieldSx}>
            {filteredBeds.map((b) => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber} — {formatCurrency(b.cost)}</MenuItem>)}
          </TextField>
        )} />
        <Controller name="stayType" control={control} render={({ field }) => (
          <TextField {...field} select fullWidth label="Stay Type" sx={fieldSx}>
            {stayTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        )} />
        <Field control={control} name="duration" label="Duration" type="number" rules={{ required: true, min: 1 }} errors={errors} />
      </Section>

      <Section title="Payment Information">
        <FinanceBox label="Bed Cost" value={formatCurrency(bedCost)} />
        <FinanceBox label="Total Amount" value={formatCurrency(totalAmount)} highlight />
        <FinanceBox label="Advance Paid" input={
          <Controller name="advancePaid" control={control} render={({ field }) => (
            <TextField {...field} type="number" fullWidth onChange={(e) => field.onChange(Number(e.target.value))} sx={fieldSx} />
          )} />
        } />
        <FinanceBox label="Balance Amount" value={formatCurrency(balanceAmount)} warning={balanceAmount > 0} />
      </Section>

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ height: 44 }}>Cancel</Button>
        <Button type="submit" variant="contained" sx={primaryButtonSx}>Save Booking</Button>
      </Box>
    </Box>
  )
}

const Section = ({ title, children }) => (
  <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fafbfc' }}>
    <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 1.5, color: '#0f172a' }}>{title}</Typography>
    <Box sx={drawerFormStackSx}>{children}</Box>
  </Box>
)

const Field = ({ control, name, label, rules, errors, type = 'text' }) => (
  <Controller name={name} control={control} rules={rules} render={({ field }) => (
    <TextField {...field} label={label} type={type} fullWidth error={!!errors[name]} helperText={errors[name]?.message} sx={fieldSx} />
  )} />
)

const FinanceBox = ({ label, value, highlight, warning, input }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: highlight ? '#bfdbfe' : warning ? '#fecaca' : '#e2e8f0', bgcolor: highlight ? '#eff6ff' : warning ? '#fef2f2' : '#f8fafc' }}>
    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>{label}</Typography>
    {input || <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'Poppins', color: warning ? '#dc2626' : '#0f172a' }}>{value}</Typography>}
  </Box>
)

export default BookingForm
