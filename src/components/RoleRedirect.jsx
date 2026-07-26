import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TeacherPanel from '../pages/TeacherManager'

export default function RoleRedirect() {
  const { profile } = useAuth()

  if (profile?.role === 'admin' || profile?.role === 'editor') {
    return <Navigate to="/branches" />
  }
  if (profile?.role === 'teacher') {
    return <TeacherPanel />
  }
  return <div className="p-4">Rol tanımsız, yöneticine ulaş.</div>
}