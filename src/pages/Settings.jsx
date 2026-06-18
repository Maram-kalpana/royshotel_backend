import { useState } from 'react'
import { TextField, Button, Switch, FormControlLabel, Divider, Typography } from '@mui/material'
import { Sun, Moon, Save, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import { useUI, useAppDispatch } from '../hooks/useStore'
import { updateSettings, setTheme } from '../redux/slices/uiSlice'
import toast from 'react-hot-toast'

const Settings = () => {
  const { settings, theme } = useUI()
  const dispatch = useAppDispatch()
  const [form, setForm] = useState({ ...settings })

  const handleSave = () => {
    dispatch(updateSettings(form))
    toast.success('Settings saved successfully!')
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    dispatch(setTheme(newTheme))
    toast.success(`Switched to ${newTheme} mode`)
  }

  return (
    <PageTransition className="page-container">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="mb-2">
            <h2 className="section-title">Settings</h2>
            <p className="text-slate-500 mt-1">Configure hotel information and preferences</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={20} />
              </div>
              <Typography variant="h6" className="font-[Poppins]! font-semibold!">Hotel Information</Typography>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField label="Hotel Name" fullWidth value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} />
              <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="GST Number" fullWidth value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              <TextField label="Address" fullWidth multiline rows={2} className="md:col-span-2!" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave} className="mt-6!">Save Changes</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <Typography variant="h6" className="font-[Poppins]! font-semibold! mb-4!">Theme Settings</Typography>
            <Divider className="mb-4!" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-400" />}
                <div>
                  <p className="font-medium text-slate-900">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                  <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
                </div>
              </div>
              <FormControlLabel
                control={<Switch checked={theme === 'dark'} onChange={handleThemeToggle} color="primary" />}
                label=""
              />
            </div>
          </motion.div>
        </div>
      </PageTransition>
  )
}

export default Settings
