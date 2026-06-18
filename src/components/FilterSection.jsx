import { Box, Button } from '@mui/material'
import { primaryButtonSx } from '../utils/layout'

const FilterSection = ({ children, onSearch, onReset }) => (
  <Box
    className="filter-section"
    sx={{
      display: 'flex',
      flexWrap: { xs: 'wrap', lg: 'nowrap' },
      alignItems: 'center',
      gap: 2,
      p: 2.5,
      mb: 2.5,
      bgcolor: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 2,
    }}
  >
    <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', lg: 'nowrap' }, alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
      {children}
    </Box>
    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'flex-end', lg: 'flex-start' } }}>
      <Button variant="contained" onClick={onSearch} sx={primaryButtonSx}>Search</Button>
      <Button variant="outlined" onClick={onReset} sx={{ height: 44, px: 3 }}>Reset</Button>
    </Box>
  </Box>
)

export default FilterSection
