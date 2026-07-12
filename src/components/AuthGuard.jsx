import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * AuthGuard — wraps routes that require authentication.
 * If no token is present, redirect to /login.
 */
const AuthGuard = ({ children }) => {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default AuthGuard
