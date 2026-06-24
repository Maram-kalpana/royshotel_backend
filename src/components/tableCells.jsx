import { Box, IconButton } from '@mui/material'

const lineSx = (primary) => ({
  fontSize: primary ? '0.8125rem' : '0.6875rem',
  fontWeight: primary ? 600 : 400,
  color: primary ? '#0f172a' : '#64748b',
  mt: primary ? 0 : 0.25,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  display: 'block',
})

export const MergedCell = ({ lines }) => (
  <Box sx={{ lineHeight: 1.35, py: 0.25, minWidth: 0, maxWidth: '100%' }}>
    {lines.filter(Boolean).map((line, i) => (
      <Box key={i} sx={lineSx(i === 0)}>
        {line}
      </Box>
    ))}
  </Box>
)

export const compactIconSx = {
  p: '2px',
  minWidth: 0,
  '& svg': { width: 14, height: 14 },
}

export const VerticalActions = ({ children }) => (
  <Box
    sx={{ display: 'flex', flexDirection: 'column', gap: 0.125, alignItems: 'center' }}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </Box>
)

export const GridActions = ({ children }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, auto)',
      gap: 0.125,
      justifyContent: 'center',
      width: 'fit-content',
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </Box>
)

export const CompactIconButton = ({ children, ...props }) => (
  <IconButton size="small" sx={compactIconSx} {...props}>
    {children}
  </IconButton>
)
