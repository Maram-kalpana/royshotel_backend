import { useEffect } from 'react'
import { useAuth, useAppDispatch } from '../hooks/useStore'
import { loadAllData } from '../services/dataService'

const AppDataLoader = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isAuthenticated) return
    if (!localStorage.getItem('hotel_token')) return
    loadAllData(dispatch).catch((err) => console.error('Bootstrap load failed:', err))
  }, [isAuthenticated, dispatch])

  return children
}

export default AppDataLoader
