import { useState, useEffect } from 'react'
import { TextField, Button, Switch, FormControlLabel, Divider, Typography, Box } from '@mui/material'
import { Sun, Moon, Save, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { useUI, useAppDispatch } from '../hooks/useStore'
import { updateSettings, setTheme } from '../redux/slices/uiSlice'
import { settingsApi } from '../services/endpoints'
import { fieldSx, primaryButtonSx } from '../utils/layout'
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
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    backgroundColor: '#fff',
    px: 0.5,
  },
}

const Settings = () => {
  const { settings, theme } = useUI()
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
      .catch((err) => console.error('Failed to load settings:', err))
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

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    dispatch(setTheme(newTheme))
    toast.success(`Switched to ${newTheme} mode`)
  }

  return (
    <PageTransition className="page-container">
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ display: 'flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb' }}>
              <Building2 size={20} />
            </Box>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Hotel Information</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Hotel Name"
              fullWidth
              disabled={loading}
              value={form.hotelName}
              onChange={updateField('hotelName')}
              sx={settingsFieldSx}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                label="Phone"
                fullWidth
                disabled={loading}
                value={form.phone}
                onChange={updateField('phone')}
                sx={settingsFieldSx}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Email"
                fullWidth
                disabled={loading}
                value={form.email}
                onChange={updateField('email')}
                sx={settingsFieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="GST Number"
              fullWidth
              disabled={loading}
              value={form.gstNumber}
              onChange={updateField('gstNumber')}
              sx={settingsFieldSx}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              minRows={3}
              disabled={loading}
              value={form.address}
              onChange={updateField('address')}
              sx={{
                ...settingsFieldSx,
                '& .MuiInputBase-root': { height: 'auto', minHeight: 88, alignItems: 'flex-start', py: 1.5 },
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={handleSave}
            disabled={loading}
            sx={{ ...primaryButtonSx, mt: 3 }}
          >
            Save Changes
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
        >
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, mb: 2 }}>Theme Settings</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-400" />}
              <Box>
                <Typography sx={{ fontWeight: 500, color: '#0f172a' }}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Toggle between light and dark themes</Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={<Switch checked={theme === 'dark'} onChange={handleThemeToggle} color="primary" />}
              label=""
            />
          </Box>
        </motion.div>
      </Box>
    </PageTransition>
  )
}

export default Settings
