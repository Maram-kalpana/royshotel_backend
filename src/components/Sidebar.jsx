import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, DoorOpen, Users, CalendarCheck, MapPin, Wallet, Settings, LogOut, ChevronLeft, ChevronRight, Receipt, CreditCard,
} from 'lucide-react'
import { useAuth, useUI, useAppDispatch } from '../hooks/useStore'
import { toggleSidebar } from '../redux/slices/uiSlice'
import { logout } from '../redux/slices/authSlice'
import { getMenuItems, ROLES } from '../utils/helpers'
import { SIDEBAR_WIDTH } from '../utils/layout'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

const iconMap = {
  LayoutDashboard, DoorOpen, Users, CalendarCheck, Receipt, MapPin, Wallet, Settings, CreditCard,
}

const NAVY = '#0B1F4D'
const ACTIVE_BG = 'rgba(96, 165, 250, 0.25)'
const ACTIVE_TEXT = '#93c5fd'

const Sidebar = () => {
  const { user } = useAuth()
  const { sidebarCollapsed } = useUI()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const width = sidebarCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-[1200] flex flex-col"
      style={{ backgroundColor: NAVY, width, height: '100vh' }}
    >
      <div className={`flex items-center border-b border-white/10 min-h-[72px] ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-2.5 py-3'}`}>
        <img
          src={logo}
          alt="Roy's Book My Square Coliving"
          className={`object-contain ${sidebarCollapsed ? 'w-10 h-10' : 'w-full max-w-[130px] h-auto'}`}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
        {getMenuItems(user?.role).map((item) => {
          const Icon = iconMap[item.icon]
          const dashboardPath = user?.role === ROLES.SUPER_ADMIN ? '/super-admin/dashboard' : '/admin/dashboard'
          const path = item.path === '/dashboard' ? dashboardPath : item.path

          return (
            <NavLink
              key={item.path}
              to={path}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-all ${
                  isActive ? 'shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center px-1.5' : ''}`
              }
              style={({ isActive }) => isActive ? { backgroundColor: ACTIVE_BG, color: ACTIVE_TEXT } : undefined}
            >
              <Icon size={16} className="shrink-0 text-white" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-1.5 py-2">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-red-300 hover:bg-red-500/10 transition-colors ${sidebarCollapsed ? 'justify-center px-1.5' : ''}`}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  )
}

export default Sidebar
