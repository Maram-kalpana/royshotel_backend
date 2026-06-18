import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, DoorOpen, Users, CalendarCheck, MapPin, Wallet, Settings, LogOut, ChevronLeft, ChevronRight, Crown, Clock,
} from 'lucide-react'
import { useAuth, useUI, useAppDispatch } from '../hooks/useStore'
import { toggleSidebar } from '../redux/slices/uiSlice'
import { logout } from '../redux/slices/authSlice'
import { getMenuItems, ROLES } from '../utils/helpers'
import { SIDEBAR_WIDTH, NAVBAR_HEIGHT } from '../utils/layout'
import toast from 'react-hot-toast'

const iconMap = {
  LayoutDashboard, DoorOpen, Users, CalendarCheck, Clock, MapPin, Wallet, Settings,
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
      className="fixed left-0 z-[1200] flex flex-col"
      style={{
        backgroundColor: NAVY,
        width,
        top: NAVBAR_HEIGHT,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 min-h-[56px]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white shrink-0">
          <Crown size={16} />
        </div>
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
            <p className="text-[10px] text-blue-200 leading-none truncate">Luxury Hotel</p>
            <p className="font-semibold text-white font-[Poppins] text-xs truncate">Management</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all ${
                  isActive ? 'shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              style={({ isActive }) => isActive ? { backgroundColor: ACTIVE_BG, color: ACTIVE_TEXT } : undefined}
            >
              <Icon size={18} className="shrink-0 text-white" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-red-300 hover:bg-red-500/10 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  )
}

export default Sidebar
