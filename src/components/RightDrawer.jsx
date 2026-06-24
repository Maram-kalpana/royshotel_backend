import { Drawer, Box, Typography, IconButton, Divider, useMediaQuery } from '@mui/material'
import { X } from 'lucide-react'
import { DRAWER_VARIANTS, hideScrollbarSx } from '../utils/layout'

const RightDrawer = ({
  open,
  onClose,
  title,
  variant = 'room',
  children,
  footer,
  compact = false,
}) => {
  const isMobile = useMediaQuery('(max-width:767px)')
  const isTablet = useMediaQuery('(max-width:1023px)')
  const width = DRAWER_VARIANTS[variant] ?? DRAWER_VARIANTS.room
  const drawerWidth = isMobile
    ? 'min(340px, 82vw)'
    : isTablet
      ? `min(${Math.min(width, 420)}px, 48vw)`
      : width

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(15, 23, 42, 0.35)' } } }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          maxWidth: isMobile ? '82vw' : isTablet ? '48vw' : width,
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
        <Box sx={{ px: 2, py: 1.5, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close drawer"><X size={18} /></IconButton>
        </Box>
        <Divider />
        <Box sx={{
          flex: 1,
          overflowY: compact ? 'visible' : 'auto',
          overflowX: 'hidden',
          p: compact ? 1.5 : 2,
          ...hideScrollbarSx,
        }}>
          {children}
        </Box>
        {footer && (
          <>
            <Divider />
            <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexShrink: 0 }}>
              {footer}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}

export default RightDrawer
