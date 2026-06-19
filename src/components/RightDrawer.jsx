import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material'
import { X } from 'lucide-react'
import { DRAWER_VARIANTS, hideScrollbarSx } from '../utils/layout'

const RightDrawer = ({
  open,
  onClose,
  title,
  variant = 'room',
  children,
  footer,
}) => {
  const width = DRAWER_VARIANTS[variant] ?? DRAWER_VARIANTS.room

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(15, 23, 42, 0.35)' },
        },
      }}
      PaperProps={{
        sx: {
          width,
          maxWidth: '95vw',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
        <Box sx={{ px: 3, py: 2, minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#0f172a', fontSize: '1.05rem' }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close drawer">
            <X size={18} />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, ...hideScrollbarSx }}>
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
