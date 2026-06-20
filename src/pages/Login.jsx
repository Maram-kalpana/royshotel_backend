import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TextField, Button, Box } from '@mui/material'
import { Shield, UserCog, User, Lock, Sparkles } from 'lucide-react'
import { useAppDispatch } from '../hooks/useStore'
import { login } from '../redux/slices/authSlice'
import { authApi } from '../services/endpoints'
import { loadAllData } from '../services/dataService'
import { ROLES } from '../utils/helpers'
import toast from 'react-hot-toast'
import heroImage from '../assets/hero.png'
import logo from '../assets/logo.png'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES.ADMIN)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password')
      return
    }

    try {
      const { token, user } = await authApi.login(username.trim(), password)
      localStorage.setItem('hotel_token', token)
      dispatch(login(user))
      await loadAllData(dispatch)
      toast.success(`Welcome, ${user.name}!`)
      navigate(user.role === ROLES.SUPER_ADMIN ? '/super-admin/dashboard' : '/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid username or password')
    }
  }

  const roles = [
    { id: ROLES.SUPER_ADMIN, label: 'Super Admin', icon: Shield },
    { id: ROLES.ADMIN, label: 'Admin', icon: UserCog },
  ]

  return (
    <div className="min-h-screen flex bg-[#0B1F4D]">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F4D]/95 via-[#1e3a8a]/80 to-[#0f172a]/90" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d4af37 0%, transparent 40%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col p-14 py-12 h-full"
        >
          <img
            src={logo}
            alt="Roy's Book My Square Coliving"
            className="w-full max-w-[280px] h-auto object-contain mb-8"
          />
          <div className="max-w-lg">
            <h1 className="text-[2.75rem] font-bold font-[Poppins] leading-[1.15] text-white mb-5">
              Grand Luxe Hotel Management
            </h1>
            <p className="text-blue-100/90 text-lg leading-relaxed mb-8">
              Streamline bookings, manage rooms, track payments, and run daily operations from one professional ERP dashboard.
            </p>
            <div className="flex items-center gap-2 text-blue-200/80 text-sm">
              <Sparkles size={16} className="text-amber-300" />
              <span>Premium hospitality management platform</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230B1F4D\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full max-w-[420px]"
        >
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(11,31,77,0.15)] border border-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#0B1F4D] via-[#1e40af] to-[#d4af37]" />

            <div className="px-8 pt-8 pb-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-[#0B1F4D] font-[Poppins]">Welcome back</h2>
                <p className="text-slate-500 mt-1.5 text-sm">Sign in to your hotel management portal</p>
              </div>

              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                {roles.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      role === id
                        ? 'bg-[#0B1F4D] text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Username</label>
                  <Box sx={{ position: 'relative' }}>
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      placeholder="Enter your username"
                      className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F4D] focus:ring-2 focus:ring-[#0B1F4D]/10 transition-all bg-white"
                    />
                  </Box>
                </Box>

                <Box>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
                  <Box sx={{ position: 'relative' }}>
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F4D] focus:ring-2 focus:ring-[#0B1F4D]/10 transition-all bg-white"
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 1,
                    height: 48,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    bgcolor: '#0B1F4D',
                    boxShadow: '0 4px 14px rgba(11, 31, 77, 0.25)',
                    '&:hover': { bgcolor: '#0a1a3d', boxShadow: '0 6px 20px rgba(11, 31, 77, 0.3)' },
                  }}
                >
                  Sign In
                </Button>
              </Box>

              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-700">Demo credentials</p>
                <p><span className="font-medium">Super Admin:</span> superadmin / SuperAdmin@123</p>
                <p><span className="font-medium">Admin:</span> admin / Admin@123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secure access for authorized hotel staff only
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
