import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TextField, Button } from '@mui/material'
import { Crown, Shield, UserCog } from 'lucide-react'
import { useAppDispatch } from '../hooks/useStore'
import { login } from '../redux/slices/authSlice'
import { ROLES } from '../utils/helpers'
import toast from 'react-hot-toast'
import heroImage from '../assets/hero.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogin = (role) => {
    const users = {
      [ROLES.SUPER_ADMIN]: { id: 'super-admin-1', name: 'Super Admin', email: 'superadmin@luxehotel.com', role: ROLES.SUPER_ADMIN },
      [ROLES.ADMIN]: { id: 'admin-1', name: 'Hotel Admin', email: 'admin@luxehotel.com', role: ROLES.ADMIN },
    }
    dispatch(login(users[role]))
    toast.success(`Welcome, ${users[role].name}!`)
    navigate(role === ROLES.SUPER_ADMIN ? '/super-admin/dashboard' : '/admin/dashboard')
  }

  const handleFormLogin = (e) => {
    e.preventDefault()
    if (email.includes('super')) handleLogin(ROLES.SUPER_ADMIN)
    else handleLogin(ROLES.ADMIN)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-slate-900/80" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md glass-card rounded-3xl p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-royal text-white shadow-lg mb-4"
          >
            <Crown size={32} />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 font-[Poppins]">Grand Luxe Hotel</h1>
          <p className="text-slate-500 mt-1">Welcome back! Sign in to your account</p>
        </div>

        <form onSubmit={handleFormLogin} className="space-y-4">
          <TextField label="Email Address" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" className="gradient-royal! py-3!">
            Sign In
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-xs text-slate-400 uppercase tracking-wider">Demo Login</p>
          <Button
            fullWidth variant="outlined" startIcon={<Shield size={18} />}
            onClick={() => handleLogin(ROLES.SUPER_ADMIN)}
            sx={{ borderColor: '#1e40af', color: '#1e40af', '&:hover': { borderColor: '#1e3a8a', bgcolor: 'rgba(30,64,175,0.04)' } }}
          >
            Login as Super Admin
          </Button>
          <Button
            fullWidth variant="outlined" startIcon={<UserCog size={18} />}
            onClick={() => handleLogin(ROLES.ADMIN)}
            sx={{ borderColor: '#d4af37', color: '#b8960c', '&:hover': { borderColor: '#b8960c', bgcolor: 'rgba(212,175,55,0.08)' } }}
          >
            Login as Admin
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
