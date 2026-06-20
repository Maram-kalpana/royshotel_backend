import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import AppDataLoader from '../components/AppDataLoader'
import { useUI } from '../hooks/useStore'
import { getSidebarOffset, hideScrollbarSx } from '../utils/layout'

const AppLayout = () => {
  const { sidebarCollapsed } = useUI()
  const sidebarOffset = getSidebarOffset(sidebarCollapsed)

  return (
    <AppDataLoader>
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          ml: `${sidebarOffset}px`,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            minWidth: 0,
            ...hideScrollbarSx,
          }}
        >
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
    </AppDataLoader>
  )
}

export default AppLayout
