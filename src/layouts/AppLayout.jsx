import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useUI } from '../hooks/useStore'
import { getSidebarOffset, NAVBAR_HEIGHT } from '../utils/layout'

const AppLayout = () => {
  const { sidebarCollapsed } = useUI()
  const sidebarOffset = getSidebarOffset(sidebarCollapsed)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar />
      <Box sx={{ display: 'flex', pt: `${NAVBAR_HEIGHT}px`, minHeight: '100vh' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            ml: `${sidebarOffset}px`,
            minWidth: 0,
            minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            overflow: 'auto',
            transition: 'margin-left 0.3s ease',
          }}
        >
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}

export { NAVBAR_HEIGHT }
export default AppLayout
