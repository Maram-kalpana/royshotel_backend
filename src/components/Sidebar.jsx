import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, DoorOpen, Users, CalendarCheck, MapPin, Wallet, Settings, LogOut, ChevronLeft, ChevronRight, Receipt, CreditCard, X,
} from 'lucide-react'
import { Drawer, IconButton, useMediaQuery } from '@mui/material'
import { useAuth, useUI, useAppDispatch } from '../hooks/useStore'
import { toggleSidebar, setMobileSidebarOpen } from '../redux/slices/uiSlice'
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

const SidebarContent = ({ sidebarCollapsed, isMobile, onNavigate }) => {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('hotel_token')
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleNavClick = () => {
    if (isMobile) dispatch(setMobileSidebarOpen(false))
    onNavigate?.()
  }

  return (
    <>
      <div className={`flex items-center border-b border-white/10 min-h-[72px] ${sidebarCollapsed && !isMobile ? 'justify-center px-2 py-3' : 'px-2.5 py-3'}`}>
        <img
          src={logo}
          alt="Roy's Book My Square Coliving"
          className={`object-contain ${sidebarCollapsed && !isMobile ? 'w-10 h-10' : 'w-full max-w-[130px] h-auto'}`}
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
              onClick={handleNavClick}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-all ${
                  isActive ? 'shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${sidebarCollapsed && !isMobile ? 'justify-center px-1.5' : ''}`
              }
              style={({ isActive }) => isActive ? { backgroundColor: ACTIVE_BG, color: ACTIVE_TEXT } : undefined}
            >
              <Icon size={16} className="shrink-0 text-white" />
              {(!sidebarCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-1.5 py-2">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-red-300 hover:bg-red-500/10 transition-colors ${sidebarCollapsed && !isMobile ? 'justify-center px-1.5' : ''}`}
          title={sidebarCollapsed && !isMobile ? 'Logout' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  )
}

const Sidebar = () => {
  const { sidebarCollapsed, mobileSidebarOpen } = useUI()
  const dispatch = useAppDispatch()
  const isMobile = useMediaQuery('(max-width:899px)')
  const width = sidebarCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={mobileSidebarOpen}
        onClose={() => dispatch(setMobileSidebarOpen(false))}
        PaperProps={{
          sx: {
            width: SIDEBAR_WIDTH.expanded,
            backgroundColor: NAVY,
            color: '#fff',
          },
        }}
        sx={{ zIndex: 1400 }}
      >
        <div className="flex flex-col h-full" style={{ backgroundColor: NAVY }}>
          <div className="flex items-center justify-end px-2 pt-2">
            <IconButton onClick={() => dispatch(setMobileSidebarOpen(false))} sx={{ color: '#fff' }} aria-label="Close menu">
              <X size={20} />
            </IconButton>
          </div>
          <SidebarContent sidebarCollapsed={false} isMobile />
        </div>
      </Drawer>
    )
  }

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-[1200] flex flex-col"
      style={{ backgroundColor: NAVY, width, height: '100vh' }}
    >
      <SidebarContent sidebarCollapsed={sidebarCollapsed} isMobile={false} />

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
