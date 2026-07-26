import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import BranchManager from './pages/BranchManager'

// Admin/Editör panelinin genel iskeleti (üst menü + içerik alanı)
function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-xl font-bold">Yönetim Paneli</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{profile?.full_name}</span>
          <button onClick={signOut} className="px-3 py-1 bg-red-500 text-white rounded">
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-4 bg-white border-b">
        <Link to="/branches" className="text-blue-600 hover:underline">Şubeler</Link>
      </div>

      {/* Alt sayfalar (BranchManager gibi) burada gösterilecek */}
      <Outlet />
    </div>
  )
}

function AdminHome() {
  return <p className="p-6 text-gray-500">Soldaki menüden bir bölüm seç.</p>
}

function TeacherPanel() {
  const { profile, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Öğretmen Paneli</h1>
      <p className="text-gray-600">Hoş geldin, {profile?.full_name}</p>
      <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded">
        Çıkış Yap
      </button>
    </div>
  )
}

function RoleRedirect() {
  const { profile } = useAuth()

  if (profile?.role === 'admin' || profile?.role === 'editor') {
    return <Navigate to="/branches" />
  }
  if (profile?.role === 'teacher') {
    return <TeacherPanel />
  }
  return <div className="p-4">Rol tanımsız, yöneticine ulaş.</div>
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-4">Yükleniyor...</div>
  if (!user) return <Navigate to="/login" />

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="branches" element={<BranchManager />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App