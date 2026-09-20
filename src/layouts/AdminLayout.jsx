import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutGrid, CalendarClock, Layers, BookOpen, Users, CalendarX, ClipboardList, SlidersHorizontal, ShieldCheck, BookMarked, Menu, X, ChevronRight, LogOut, CircleHelp } from '../components/UiMarks'

const menuGroups = [
  { label: 'Genel bakış', items: [{ to: '/dashboard', label: 'Kontrol paneli', icon: LayoutGrid }] },
  { label: 'Program dosyası', items: [{ to: '/schedule', label: 'Program oluşturucu', icon: CalendarClock }, { to: '/assignments', label: 'Ders atamaları', icon: ClipboardList }, { to: '/constraints', label: 'Öğretmen kısıtları', icon: CalendarX }] },
  { label: 'Okul kayıtları', items: [{ to: '/branches', label: 'Şubeler', icon: Layers }, { to: '/courses', label: 'Dersler', icon: BookOpen }, { to: '/teachers', label: 'Öğretmenler', icon: Users }] },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth(); const location = useLocation(); const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false)
  const roleLabels = { admin: 'Okul müdürü', editor: 'Editör', teacher: 'Öğretmen' }
  const initials = (profile?.full_name || '?').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const pageNames = { '/dashboard': 'Kontrol paneli', '/schedule': 'Program oluşturucu', '/assignments': 'Ders atamaları', '/constraints': 'Öğretmen kısıtları', '/branches': 'Şubeler', '/courses': 'Dersler', '/teachers': 'Öğretmenler', '/users': 'Kullanıcı yönetimi', '/time-settings': 'Zaman ayarları' }
  const items = [...menuGroups]
  if (profile?.role === 'admin') items.push({ label: 'Yönetim', items: [{ to: '/users', label: 'Kullanıcı yönetimi', icon: ShieldCheck }, { to: '/time-settings', label: 'Zaman ayarları', icon: SlidersHorizontal }] })

  const sidebarContent = <>
    <div className="px-5 pt-6 pb-9">
      <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'} className={'flex items-center gap-3 w-full text-left ' + (collapsed ? 'justify-center' : '')}>
        <div className="w-10 h-10 rounded bg-[#1f5c4b] flex items-center justify-center text-[#f4f1e9] shrink-0"><BookMarked /></div>
        {!collapsed && <div><p className="font-semibold text-[#f4f1e9] text-[17px]">EduShift</p><p className="text-[10px] tracking-[.16em] text-[#a8b6aa] font-mono mt-1">SCHOOL OPS</p></div>}
      </button>
    </div>
    <nav className={'flex-1 px-3 overflow-y-auto ' + (collapsed ? 'space-y-4' : 'space-y-7')}>
      {items.map((group) => <div key={group.label}>
        {!collapsed && <p className="px-3 mb-2 text-[10px] tracking-[.14em] text-[#899a8c] font-mono uppercase">{group.label}</p>}
        <div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = location.pathname === item.to; return <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={'group flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium ' + (collapsed ? 'justify-center' : '') + (active ? 'bg-[#f4f1e9] text-[#202822]' : 'text-[#b6c0b7] hover:bg-[#294437] hover:text-[#f4f1e9]')}><Icon className={active ? 'text-[#1f5c4b]' : 'text-[#a8b6aa]'} />{!collapsed && <><span className="flex-1">{item.label}</span>{active && <ChevronRight className="text-[#68726b]" />}</>}</Link> })}</div>
      </div>)}
    </nav>
    <div className="px-4 pb-5 pt-6 border-t border-[#294437]">
      {!collapsed && <p className="text-[11px] leading-relaxed text-[#a8b6aa] mb-5">Programı yayınlamadan önce kontrol listesindeki üç kanıtı tamamla.</p>}
      <div className={'flex items-center gap-3 ' + (collapsed ? 'justify-center' : '')}><div className="w-9 h-9 rounded bg-[#294437] flex items-center justify-center text-[#d5e3d5] font-mono text-xs">{initials}</div>{!collapsed && <div className="min-w-0"><p className="text-sm font-medium text-[#f4f1e9] truncate">{profile?.full_name || 'Kullanıcı'}</p><p className="text-xs text-[#a8b6aa] mt-0.5">{roleLabels[profile?.role] || profile?.role}</p></div>}</div>
      <button onClick={signOut} title="Çıkış yap" className={'mt-4 flex items-center gap-2 text-xs text-[#a8b6aa] hover:text-[#f4f1e9] px-1 ' + (collapsed ? 'justify-center w-full' : '')}><LogOut />{!collapsed && 'Çıkış yap'}</button>
    </div>
  </>

  return <div className="min-h-screen flex bg-[#e9e6de]">
    <aside className={'hidden md:flex flex-col bg-[#202822] transition-all duration-150 shrink-0 ' + (collapsed ? 'w-[76px]' : 'w-[252px]')}>{sidebarContent}</aside>
    {mobileOpen && <div className="md:hidden fixed inset-0 z-50 flex"><div className="absolute inset-0 bg-[#202822]/75" onClick={() => setMobileOpen(false)} /><aside className="relative w-[280px] bg-[#202822] flex flex-col"><button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 text-[#a8b6aa]"><X /></button>{sidebarContent}</aside></div>}
    <main className="flex-1 flex flex-col min-w-0">
      <header className="h-[76px] bg-[#f4f1e9] border-b border-[#cbcfc8] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded border border-[#cbcfc8] flex items-center justify-center text-[#202822]"><Menu /></button><div><p className="text-[10px] uppercase tracking-[.15em] text-[#68726b] font-mono">Haftalık planlama / 2026</p><h1 className="text-base font-semibold text-[#202822]">{pageNames[location.pathname] || 'EduShift'}</h1></div></div><div className="hidden sm:flex items-center gap-5"><div className="flex items-center gap-2 text-xs text-[#68726b] font-mono"><span className="w-2 h-2 rounded bg-[#1f5c4b]" /> canlı veri</div><button className="w-8 h-8 rounded border border-[#cbcfc8] text-[#68726b] flex items-center justify-center" title="Yardım"><CircleHelp /></button></div></header>
      <div className="flex-1 overflow-y-auto"><Outlet /></div>
    </main>
  </div>
}
