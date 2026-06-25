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
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  '& .MuiInputBase-root': {
    height: 44,
    fontSize: '0.875rem',
    width: '100%',
  },
  '& .MuiPickersInputBase-root': {
    width: '100%',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
  },
  '& .MuiFormLabel-root': {
    fontSize: '0.875rem',
  },
  ...noSpinnerSx,
}

/** Select menus inside drawers — must sit above drawer modal (1400) */
// export const drawerSelectMenuProps = {
//   disablePortal: false,
//   disableAutoFocus: true,
//   disableEnforceFocus: true,
//   disableScrollLock: true,
//   anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
//   transformOrigin: { vertical: 'top', horizontal: 'left' },
//   PaperProps: {
//     sx: {
//       maxHeight: 280,
//       zIndex: 2000,
//     },
//     style: { zIndex: 2000 },
//   },
//   MenuListProps: { sx: { zIndex: 2000 } },
//   sx: { zIndex: 2000 },
// }
/** Select menus inside drawers — must sit above drawer modal (1400) */
export const drawerSelectMenuProps = {
  disableAutoFocus: true,
  disableEnforceFocus: true,
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
  slotProps: {
    paper: { sx: { maxHeight: 280 } },
  },
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

export const toolbarEqualFieldSx = {
  ...fieldSx,
  flex: '1 1 0',
  minWidth: 0,
  maxWidth: 'none',
  width: 'auto',
  '& .MuiInputBase-root': { height: 40, fontSize: '0.8125rem' },
}

export const toolbarRowFieldSx = toolbarEqualFieldSx

/** Compact search on customers page (desktop) */
export const toolbarSearchCompactSx = {
  ...toolbarEqualFieldSx,
  flex: { xs: 1, md: '0 0 200px' },
  maxWidth: { md: 240 },
}

export const toolbarFilterDateSx = {
  ...toolbarEqualFieldSx,
}

export const compactDateFilterSx = {
  ...fieldSx,
  flex: '0 0 auto',
  width: { xs: '100%', sm: 150 },
  maxWidth: 150,
  minWidth: 130,
  '& .MuiInputBase-root': { height: 40, fontSize: '0.8125rem' },
}

export const expenseFilterFieldSx = {
  ...compactDateFilterSx,
  flex: '0 0 auto',
  width: { xs: 130, sm: 150 },
  minWidth: { xs: 120, sm: 140 },
  maxWidth: 150,
}

export const toolbarButtonSx = {
  ...primaryButtonSx,
  flexShrink: 0,
  height: 40,
  minWidth: 'auto',
  px: { xs: 1.5, sm: 2.5 },
  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
}





export const amountFieldSx = {
  ...fieldSx,
}

export const getSidebarOffset = (collapsed) =>
  collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded

export const drawerFormStackSx = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
  gap: 1.5,
  minWidth: 0,
  width: '100%',
  maxWidth: '100%',
}

export const drawerSectionSx = {
  p: 1.5,
  border: '1px solid #e2e8f0',
  bgcolor: '#fafbfc',
  borderRadius: 1,
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'visible',
  boxSizing: 'border-box',
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
