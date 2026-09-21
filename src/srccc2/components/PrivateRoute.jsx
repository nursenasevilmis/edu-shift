import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-4">Yükleniyor...</div>
  if (!user) return <Navigate to="/login" />

  return children
}