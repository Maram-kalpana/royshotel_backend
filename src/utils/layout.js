export const SIDEBAR_WIDTH = {
  expanded: 158,
  collapsed: 56,
}

export const NAVBAR_HEIGHT = 70

export const DRAWER_VARIANTS = {
  room: 450,
  booking: 550,
  customer: 520,
  income: 480,
  view: 500,
}

export const noSpinnerSx = {
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
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
  ...noSpinnerSx,
}

export const filterFieldSx = {
  ...fieldSx,
  flex: { xs: '1 1 0', md: '1 1 180px' },
  minWidth: { xs: 0, md: 180 },
  maxWidth: { xs: 'none', md: 220 },
}

/** Search field in page toolbar — shares row with Add button on mobile */
export const primaryButtonSx = {
  bgcolor: '#0B1F4D',
  height: 44,
  px: 3,
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#0a1a3d' },
}

export const toolbarSearchSx = {
  ...fieldSx,
  flex: 1,
  minWidth: 0,
  width: 'auto',
  '& .MuiInputBase-root': { height: 40, fontSize: '0.8125rem' },
}

export const toolbarButtonSx = {
  ...primaryButtonSx,
  flexShrink: 0,
  height: 40,
  minWidth: 'auto',
  px: { xs: 1.5, sm: 2.5 },
  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
}

export const compactDateFilterSx = {
  ...fieldSx,
  flex: '0 0 auto',
  width: { xs: '100%', sm: 150 },
  maxWidth: 150,
  minWidth: 130,
  '& .MuiInputBase-root': { height: 40, fontSize: '0.8125rem' },
}



export const amountFieldSx = {
  ...fieldSx,
}

export const getSidebarOffset = (collapsed) =>
  collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded

export const drawerFormStackSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 1.5,
}

export const drawerSectionSx = {
  p: 1.5,
  border: '1px solid #e2e8f0',
  bgcolor: '#fafbfc',
  borderRadius: 1,
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
