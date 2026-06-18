import { Box } from '@mui/material'
import { drawerFormStackSx } from '../utils/layout'

const DrawerFormStack = ({ children }) => (
  <Box sx={drawerFormStackSx}>{children}</Box>
)

export default DrawerFormStack
