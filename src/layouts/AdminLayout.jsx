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
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  LogOut,
  CircleHelp,
} from '../components/UiMarks'

const menuGroups = [
  { label: 'Planlama', items: [{ to: '/dashboard', label: 'Kontrol paneli', icon: LayoutGrid }] },
  {
    label: 'Program dosyası',
    items: [
      { to: '/schedule', label: 'Program oluşturucu', icon: CalendarClock },
      { to: '/assignments', label: 'Ders atamaları', icon: ClipboardList },
      { to: '/constraints', label: 'Öğretmen kısıtları', icon: CalendarX },
    ],
  },
  {
    label: 'Okul kayıtları',
    items: [
      { to: '/branches', label: 'Şubeler', icon: Layers },
      { to: '/courses', label: 'Dersler', icon: BookOpen },
      { to: '/teachers', label: 'Öğretmenler', icon: Users },
    ],
  },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const roleLabels = { admin: 'Okul müdürü', editor: 'Editör', teacher: 'Öğretmen' }
  const initials = (profile?.full_name || '?').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const pageNames = {
    '/dashboard': 'Kontrol paneli',
    '/schedule': 'Program oluşturucu',
    '/assignments': 'Ders atamaları',
    '/constraints': 'Öğretmen kısıtları',
    '/branches': 'Şubeler',
    '/courses': 'Dersler',
    '/teachers': 'Öğretmenler',
    '/users': 'Kullanıcı yönetimi',
    '/time-settings': 'Zaman ayarları',
  }
  const items = [...menuGroups]
  if (profile?.role === 'admin') {
    items.push({
      label: 'Yönetim',
      items: [
        { to: '/users', label: 'Kullanıcı yönetimi', icon: ShieldCheck },
        { to: '/time-settings', label: 'Zaman ayarları', icon: SlidersHorizontal },
      ],
    })
  }

  const sidebarContent = (
    <>
      <div className={'sidebar-brand ' + (collapsed ? 'is-collapsed' : '')}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
          className="sidebar-toggle"
          aria-label={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
        >
          <span className="brand-chip">ES</span>
          {!collapsed && (
            <span>
              <span className="brand-name">EduShift</span>
              <span className="brand-subtitle">School ops</span>
            </span>
          )}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Ana navigasyon">
        {items.map((group) => (
          <div key={group.label} className="sidebar-group">
            {!collapsed && <p className="sidebar-label">{group.label}</p>}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={'sidebar-item ' + (collapsed ? 'is-collapsed ' : '') + (active ? 'is-active' : '')}
                >
                  <span className="nav-icon"><Icon /></span>
                  {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                  {!collapsed && active && <ChevronRight />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && <p className="sidebar-note">Yayın öncesi kontrol listesini tamamlayınca programın paylaşılmaya hazır.</p>}
        <div className={'profile-row ' + (collapsed ? 'justify-center' : '')}>
          <span className="profile-avatar">{initials}</span>
          {!collapsed && (
            <span className="min-w-0">
              <p className="profile-name">{profile?.full_name || 'Kullanıcı'}</p>
              <p className="profile-role">{roleLabels[profile?.role] || profile?.role}</p>
            </span>
          )}
        </div>
        <button onClick={signOut} title="Çıkış yap" className={'sign-out ' + (collapsed ? 'w-full justify-center' : '')}>
          <LogOut />
          {!collapsed && 'Çıkış yap'}
        </button>
      </div>
    </>
  )

  return (
    <div className="app-shell">
      <aside className={'app-sidebar ' + (collapsed ? 'is-collapsed' : '')}>{sidebarContent}</aside>
      {mobileOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="mobile-drawer-panel">
            <button onClick={() => setMobileOpen(false)} className="mobile-drawer-close" aria-label="Menüyü kapat"><X /></button>
            {sidebarContent}
          </aside>
        </div>
      )}
      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-leading">
            <button onClick={() => setMobileOpen(true)} className="mobile-menu-button md:hidden" aria-label="Menüyü aç"><Menu /></button>
            <div>
              <p className="topbar-context">Haftalık planlama / 2026</p>
              <h1 className="topbar-title">{pageNames[location.pathname] || 'EduShift'}</h1>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="live-indicator">Canlı veri</span>
            <button className="topbar-help" title="Yardım" aria-label="Yardım"><CircleHelp /></button>
          </div>
        </header>
        <div className="flex-1 min-w-0 overflow-y-auto"><Outlet /></div>
      </main>
    </div>
  )
}
