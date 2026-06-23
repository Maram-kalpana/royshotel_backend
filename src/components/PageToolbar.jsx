import { Box } from '@mui/material'

/** Primary row: filters/search grow, action button stays pinned on the right (mobile + desktop). */
const PageToolbar = ({ filters, action, secondary, sx }) => (
  <Box sx={{ mb: 2, ...sx }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'nowrap',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          minWidth: 0,
          flexWrap: { xs: 'nowrap', md: 'wrap' },
          overflow: { xs: 'auto', md: 'visible' },
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {filters}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0 }}>{action}</Box>
      )}
    </Box>
    {secondary && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 1, mt: 1 }}>
        {secondary}
      </Box>
    )}
  </Box>
)

export default PageToolbar
