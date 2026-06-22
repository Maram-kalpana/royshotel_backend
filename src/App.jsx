import AppRoutes from './routes'
import AuthBootstrap from './components/AuthBootstrap'

function App() {
  return (
    <AuthBootstrap>
      <AppRoutes />
    </AuthBootstrap>
  )
}

export default App
