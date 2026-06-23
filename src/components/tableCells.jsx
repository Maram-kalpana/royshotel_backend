import { Box } from '@mui/material'

export const MergedCell = ({ lines }) => (
  <Box sx={{ lineHeight: 1.35, py: 0.25 }}>
    {lines.filter(Boolean).map((line, i) => (
      <Box
        key={i}
        sx={{
          fontSize: i === 0 ? '0.8125rem' : '0.75rem',
          fontWeight: i === 0 ? 600 : 400,
          color: i === 0 ? '#0f172a' : '#64748b',
          mt: i > 0 ? 0.25 : 0,
          wordBreak: 'break-word',
        }}
      >
        {line}
      </Box>
    ))}
  </Box>
)

export const VerticalActions = ({ children }) => (
  <Box
    sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'center' }}
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
      gap: 0.25,
      justifyContent: 'center',
      width: 'fit-content',
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </Box>
)
