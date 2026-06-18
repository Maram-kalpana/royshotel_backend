import { AppBar, Toolbar, IconButton, Badge, Avatar, InputBase, Box } from '@mui/material'
import { Menu, Search, Bell } from 'lucide-react'
import { useUI, useAuth, useAppDispatch } from '../hooks/useStore'
import { toggleSidebar, setGlobalSearch } from '../redux/slices/uiSlice'
import { NAVBAR_HEIGHT } from '../utils/layout'

const Navbar = () => {
  const { globalSearch } = useUI()
  const { user } = useAuth()
  const dispatch = useAppDispatch()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: NAVBAR_HEIGHT,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: 1300,
      }}
    >
      <Toolbar disableGutters sx={{ height: NAVBAR_HEIGHT, minHeight: `${NAVBAR_HEIGHT}px !important`, px: 2, gap: 2 }}>
        <IconButton onClick={() => dispatch(toggleSidebar())} edge="start" size="small" sx={{ flexShrink: 0, display: { lg: 'none' } }}>
          <Menu size={20} />
        </IconButton>

        <Box
          sx={{
            width: { xs: '100%', md: '70%' },
            maxWidth: 720,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            height: 44,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
          }}
        >
          <Search size={18} className="text-slate-400 shrink-0" />
          <InputBase
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
          <IconButton size="small" aria-label="Notifications">
            <Badge badgeContent={3} color="error" variant="dot">
              <Bell size={18} />
            </Badge>
          </IconButton>
          <Avatar sx={{ width: 38, height: 38, bgcolor: '#0B1F4D', fontSize: 14 }}>
            {user?.name?.charAt(0)}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
