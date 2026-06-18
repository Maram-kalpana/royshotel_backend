import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import { ROLES } from '../utils/helpers'

import Login from '../pages/Login'
import SuperAdminDashboard from '../pages/SuperAdminDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import Rooms from '../pages/Rooms'
import Customers from '../pages/Customers'
import Bookings from '../pages/Bookings'
import Vacancy from '../pages/Vacancy'
import Pendings from '../pages/Pendings'
import Accounts from '../pages/Accounts'
import CustomerProfile from '../pages/CustomerProfile'
import Checkout from '../pages/Checkout'
import Settings from '../pages/Settings'
import RoleDashboardRedirect from './RoleDashboardRedirect'

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/login" replace />} />

    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/super-admin/dashboard" element={
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}><SuperAdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/customers/:id" element={<CustomerProfile />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/pendings" element={<Pendings />} />
      <Route path="/vacancy" element={<Vacancy />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/checkout/:id" element={<Checkout />} />
      <Route path="/settings" element={<Settings />} />

      {/* Legacy routes redirected */}
      <Route path="/floors" element={<Navigate to="/rooms" replace />} />
      <Route path="/beds" element={<Navigate to="/rooms" replace />} />
      <Route path="/vacancies" element={<Navigate to="/vacancy" replace />} />
      <Route path="/reports" element={<Navigate to="/accounts" replace />} />
      <Route path="/analytics" element={<RoleDashboardRedirect />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

export default AppRoutes
