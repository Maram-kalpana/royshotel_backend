import { AppBar, Toolbar, IconButton, Avatar, InputBase, Box, Typography, useMediaQuery } from '@mui/material'
import { Search, Menu, ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUI, useAuth, useAppDispatch } from '../hooks/useStore'
import { setGlobalSearch, toggleMobileSidebar } from '../redux/slices/uiSlice'
import { getPageTitle } from '../utils/helpers'
import { NAVBAR_HEIGHT } from '../utils/layout'

const Navbar = () => {
  const { globalSearch } = useUI()
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { pathname } = useLocation()
  const pageTitle = getPageTitle(pathname)
  const isMobile = useMediaQuery('(max-width:899px)')

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        height: { xs: 56, md: NAVBAR_HEIGHT },
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: 1100,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          height: { xs: 56, md: NAVBAR_HEIGHT },
          minHeight: { xs: '56px !important', md: `${NAVBAR_HEIGHT}px !important` },
          px: { xs: 1.5, md: 2 },
          display: 'grid',
          gridTemplateColumns: { xs: 'auto 1fr auto', md: 'minmax(120px, 1fr) minmax(280px, 480px) minmax(120px, 1fr)' },
          alignItems: 'center',
          gap: 2,
        }}
      >
        {isMobile && (
          <IconButton
            size="small"
            aria-label="Open menu"
            onClick={() => dispatch(toggleMobileSidebar())}
            sx={{ color: '#0B1F4D', order: { xs: 0, sm: 0 } }}
          >
            <Menu size={22} />
          </IconButton>
        )}

        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.125rem' },
            color: '#0B1F4D',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            gridColumn: { xs: 'span 1', sm: 'auto' },
          }}
        >
          {pageTitle}
        </Typography>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            height: 44,
            borderRadius: '999px',
            border: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            order: { xs: 3, sm: 0 },
            width: { xs: '100%', sm: 'auto' },
            maxWidth: '100%',
            minWidth: 0,
            justifySelf: 'center',
          }}
        >
          <Search size={18} className="text-slate-400 shrink-0" />
          <InputBase
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
            sx={{ flex: 1, fontSize: '0.875rem', color: '#334155', minWidth: 0 }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifySelf: 'end',
            flexShrink: 0,
            order: { xs: 1, sm: 0 },
          }}
        >
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
