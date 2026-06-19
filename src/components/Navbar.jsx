import { AppBar, Toolbar, IconButton, Badge, Avatar, InputBase, Box, Typography } from '@mui/material'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { useUI, useAuth, useAppDispatch } from '../hooks/useStore'
import { setGlobalSearch } from '../redux/slices/uiSlice'
import { NAVBAR_HEIGHT } from '../utils/layout'

const Navbar = () => {
  const { globalSearch } = useUI()
  const { user } = useAuth()
  const dispatch = useAppDispatch()

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        height: NAVBAR_HEIGHT,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: 1100,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Toolbar disableGutters sx={{ height: NAVBAR_HEIGHT, minHeight: `${NAVBAR_HEIGHT}px !important`, px: 2, gap: 2 }}>
        <Box
          sx={{
            flex: 1,
            maxWidth: 640,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            height: 44,
            borderRadius: '999px',
            border: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
          }}
        >
          <Search size={18} className="text-slate-400 shrink-0" />
          <InputBase
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
            sx={{ flex: 1, fontSize: '0.875rem', color: '#334155' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto', flexShrink: 0 }}>
          <IconButton size="small" aria-label="Notifications" sx={{ color: '#64748b' }}>
            <Badge color="error" variant="dot" overlap="circular">
              <Bell size={20} />
            </Badge>
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#0B1F4D', fontSize: 14, fontWeight: 600 }}>
              {user?.name?.charAt(0) || 'H'}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', display: { xs: 'none', sm: 'block' } }}>
              {user?.name || 'User'}
            </Typography>
            <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
