import { useEffect, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useAuth, useAppDispatch } from '../hooks/useStore'
import { login } from '../redux/slices/authSlice'
import { authApi } from '../services/endpoints'

const AuthBootstrap = ({ children }) => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const token = localStorage.getItem('hotel_token')
      if (!token || isAuthenticated) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const user = await authApi.me()
        if (!cancelled) dispatch(login(user))
      } catch {
        localStorage.removeItem('hotel_token')
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    bootstrap()
    return () => { cancelled = true }
  }, [dispatch, isAuthenticated])

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress size={36} />
      </Box>
    )
  }

  return children
}

export default AuthBootstrap
