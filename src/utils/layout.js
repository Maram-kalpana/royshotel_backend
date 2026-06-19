export const SIDEBAR_WIDTH = {
  expanded: 158,
  collapsed: 56,
}

export const NAVBAR_HEIGHT = 70

export const DRAWER_VARIANTS = {
  room: 450,
  booking: 550,
  customer: 500,
  income: 500,
}

export const fieldSx = {
  width: '100%',
  '& .MuiInputBase-root': {
    height: 44,
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
  },
  '& .MuiFormLabel-root': {
    fontSize: '0.875rem',
  },
}

export const filterFieldSx = {
  ...fieldSx,
  flex: { xs: '1 1 100%', md: '1 1 180px' },
  minWidth: { xs: '100%', md: 180 },
  maxWidth: { md: 220 },
}

export const primaryButtonSx = {
  bgcolor: '#0B1F4D',
  height: 44,
  px: 3,
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#0a1a3d' },
}

export const getSidebarOffset = (collapsed) =>
  collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded

export const drawerFormStackSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

export const horizontalScrollbarSx = {
  overflowX: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#94a3b8 #f1f5f9',
  '&::-webkit-scrollbar': {
    height: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#94a3b8',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f5f9',
  },
}

export const hideScrollbarSx = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}
