import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutGrid,
  CalendarClock,
  Layers,
  BookOpen,
  Users,
  CalendarX,
  ClipboardList,
  SlidersHorizontal,
  User,
  ShieldCheck,
  BookMarked,
  Menu,
  X,
} from 'lucide-react'

const menuItems = [
  { to: '/dashboard', label: 'Kontrol Paneli', icon: LayoutGrid },
  { to: '/branches', label: 'Subeler', icon: Layers },
  { to: '/courses', label: 'Dersler', icon: BookOpen },
  { to: '/teachers', label: 'Ogretmenler', icon: Users },
  { to: '/constraints', label: 'Ogretmen Kisitlari', icon: CalendarX },
  { to: '/assignments', label: 'Ders Atamalari', icon: ClipboardList },
  { to: '/schedule', label: 'Program Olusturucu', icon: CalendarClock },
  { to: '/time-settings', label: 'Zaman Ayarlari', icon: SlidersHorizontal },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = [...menuItems]

  if (profile?.role === 'admin') {
    items.push({ to: '/users', label: 'Kullanicilar', icon: ShieldCheck })
  }

  function isActive(to) {
    return location.pathname === to
  }

  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabels = { admin: 'Yonetici', editor: 'Editor', teacher: 'Ogretmen' }

  const sidebarContent = (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Menuyu ac' : 'Menuyu daralt'}
        className={'p-5 flex items-center gap-3 border-b border-slate-50 w-full text-left hover:bg-slate-50 transition-colors duration-150 ' + (collapsed ? 'justify-center' : '')}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
          <BookMarked size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-tight truncate">EduSchedule</p>
            <p className="text-[10px] tracking-wider text-slate-400 font-medium">DERS PROGRAMI</p>
          </div>
        )}
      </button>

      {!collapsed && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] tracking-wider text-slate-400 font-semibold">CALISMA ALANI</p>
        </div>
      )}

      <nav className={'flex-1 px-3 flex flex-col gap-1 overflow-y-auto ' + (collapsed ? 'mt-4' : 'mt-1')}>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 shrink-0 ' +
                (collapsed ? 'justify-center' : '') +
                ' ' +
                (active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700')
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <div className={'flex items-center gap-3 px-2 py-2 rounded-xl ' + (collapsed ? 'justify-center' : '')}>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400">{roleLabels[profile?.role] || profile?.role}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={signOut}
            className="w-full mt-2 text-xs text-slate-400 hover:text-rose-500 transition-colors duration-150 text-left px-2"
          >
            Cikis yap
          </button>
        )}
        {collapsed && (
          <button
            onClick={signOut}
            title="Cikis yap"
            className="w-full mt-2 flex justify-center text-slate-400 hover:text-rose-500 transition-colors duration-150"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className={
          'hidden md:flex flex-col bg-white border-r border-slate-100 transition-all duration-200 ' +
          (collapsed ? 'w-20' : 'w-64')
        }
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="relative w-64 bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}