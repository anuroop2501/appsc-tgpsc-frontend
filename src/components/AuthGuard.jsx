import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * AuthGuard — wraps routes that require authentication.
 * If no token is present, redirect to /login and preserve intended location.
 */
const AuthGuard = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default AuthGuard
