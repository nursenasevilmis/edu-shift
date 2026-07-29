import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { to: '/branches', label: 'Şubeler' },
  { to: '/courses', label: 'Dersler' },
  { to: '/teachers', label: 'Öğretmenler' },
  { to: '/constraints', label: 'Öğretmen Kısıtları' },
  
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col">
        <div className="p-5 text-lg font-bold border-b border-slate-700 flex items-center gap-2">
          <span className="text-blue-400">📅</span> EduSchedule
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-sm text-slate-300 mb-2">{profile?.full_name}</p>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
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