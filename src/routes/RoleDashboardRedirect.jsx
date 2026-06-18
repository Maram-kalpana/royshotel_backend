import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useStore'
import { ROLES } from '../utils/helpers'

const RoleDashboardRedirect = () => {
  const { user } = useAuth()
  const path = user?.role === ROLES.SUPER_ADMIN ? '/super-admin/dashboard' : '/admin/dashboard'
  return <Navigate to={path} replace />
}

export default RoleDashboardRedirect
