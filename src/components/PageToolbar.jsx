import { Box } from '@mui/material'

/** Primary row: filters/search grow; optional second row for more filters + action. */
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
          flexWrap: 'wrap',
          overflow: 'visible',
        }}
      >
        {filters}
      </Box>
      {action && !secondary && (
        <Box sx={{ flexShrink: 0 }}>{action}</Box>
      )}
    </Box>
    {secondary && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1 }}>
        {secondary}
      </Box>
    )}
  </Box>
)

export default PageToolbar
