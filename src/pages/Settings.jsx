import { useState, useEffect } from 'react'
import { TextField, Button, Typography, Box, Divider } from '@mui/material'
import { Save, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { useUI, useAppDispatch } from '../hooks/useStore'
import { updateSettings } from '../redux/slices/uiSlice'
import { settingsApi } from '../services/endpoints'
import { fieldSx, primaryButtonSx } from '../utils/layout'
import { displayValue } from '../utils/helpers'
import toast from 'react-hot-toast'

const defaultSettings = {
  hotelName: '',
  phone: '',
  email: '',
  gstNumber: '',
  address: '',
}

const settingsFieldSx = {
  ...fieldSx,
  '& .MuiInputBase-root': { height: 'auto', minHeight: 44, py: 0.5 },
  '& .MuiInputLabel-root': { fontSize: '0.875rem', backgroundColor: '#fff', px: 0.5 },
}

const PreviewRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 1, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 } }}>
    <Typography variant="body2" sx={{ color: '#64748b', minWidth: 110, flexShrink: 0 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a', wordBreak: 'break-word' }}>{displayValue(value)}</Typography>
  </Box>
)

const Settings = () => {
  const { settings } = useUI()
  const dispatch = useAppDispatch()
  const [form, setForm] = useState({ ...defaultSettings, ...settings })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingsApi.get()
      .then((data) => {
        if (data) {
          setForm((prev) => ({ ...prev, ...data }))
          dispatch(updateSettings(data))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dispatch])

  const updateField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    try {
      const saved = await settingsApi.update(form)
      dispatch(updateSettings(saved || form))
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    }
  }

  return (
    <PageTransition className="page-container">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box sx={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb' }}>
              <Building2 size={18} />
            </Box>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '1rem' }}>Hotel Information</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Hotel Name" fullWidth disabled={loading} value={form.hotelName} onChange={updateField('hotelName')} sx={settingsFieldSx} InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Phone" fullWidth disabled={loading} value={form.phone} onChange={updateField('phone')} sx={settingsFieldSx} InputLabelProps={{ shrink: true }} />
              <TextField label="Email" fullWidth disabled={loading} value={form.email} onChange={updateField('email')} sx={settingsFieldSx} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField label="GST Number" fullWidth disabled={loading} value={form.gstNumber} onChange={updateField('gstNumber')} sx={settingsFieldSx} InputLabelProps={{ shrink: true }} />
            <TextField label="Address" fullWidth multiline minRows={3} disabled={loading} value={form.address} onChange={updateField('address')} sx={{ ...settingsFieldSx, '& .MuiInputBase-root': { minHeight: 88, alignItems: 'flex-start', py: 1.5 } }} InputLabelProps={{ shrink: true }} />
          </Box>

          <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave} disabled={loading} sx={{ ...primaryButtonSx, mt: 2.5 }}>
            Save Changes
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 lg:sticky lg:top-4">
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '1rem', mb: 1 }}>Preview</Typography>
          <Divider sx={{ mb: 2 }} />
          <PreviewRow label="Hotel Name" value={form.hotelName} />
          <PreviewRow label="Phone" value={form.phone} />
          <PreviewRow label="Email" value={form.email} />
          <PreviewRow label="GST Number" value={form.gstNumber} />
          <PreviewRow label="Address" value={form.address} />
        </motion.div>
      </Box>
    </PageTransition>
  )
}

export default Settings
