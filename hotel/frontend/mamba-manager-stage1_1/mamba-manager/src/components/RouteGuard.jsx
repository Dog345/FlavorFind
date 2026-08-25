import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export function RequireRole({ roles, children }) {
  const role = useAuthStore((s) => s.user?.role)

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}
