import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { to: '/branches', label: 'Şubeler' },
  { to: '/courses', label: 'Dersler' },
  { to: '/teachers', label: 'Öğretmenler' },
  // ileride: { to: '/teachers', label: 'Öğretmenler' },
  // ileride: { to: '/constraints', label: 'Öğretmen Kısıtları' },
  // ileride: { to: '/schedule', label: 'Program Oluşturucu' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-slate-700">
          Haftalık Ders Programı
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 rounded hover:bg-slate-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-300 mb-2">{profile?.full_name}</p>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-sm transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}