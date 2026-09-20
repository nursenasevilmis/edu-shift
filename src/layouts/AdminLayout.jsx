import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutGrid, CalendarClock, Layers, BookOpen, Users, CalendarX,
  ClipboardList, SlidersHorizontal, ShieldCheck, BookMarked, Menu, X,
  ChevronRight, Sparkles, LogOut, CircleHelp,
} from 'lucide-react'

const menuGroups = [
  {
    label: 'Genel Bakış',
    items: [{ to: '/dashboard', label: 'Kontrol Paneli', icon: LayoutGrid }],
  },
  {
    label: 'Program Operasyonu',
    items: [
      { to: '/schedule', label: 'Program Oluşturucu', icon: CalendarClock, accent: true },
      { to: '/assignments', label: 'Ders Atamaları', icon: ClipboardList },
      { to: '/constraints', label: 'Öğretmen Kısıtları', icon: CalendarX },
    ],
  },
  {
    label: 'Okul Verileri',
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
  const roleLabels = { admin: 'Okul Müdürü', editor: 'Editör', teacher: 'Öğretmen' }
  const initials = (profile?.full_name || '?').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const pageNames = { '/dashboard': 'Kontrol Paneli', '/schedule': 'Program Oluşturucu', '/assignments': 'Ders Atamaları', '/constraints': 'Öğretmen Kısıtları', '/branches': 'Şubeler', '/courses': 'Dersler', '/teachers': 'Öğretmenler', '/users': 'Kullanıcı Yönetimi', '/time-settings': 'Zaman Ayarları' }
  const currentPage = pageNames[location.pathname] || 'EduShift'

  const items = menuGroups.map((group) => ({ ...group, items: [...group.items] }))
  if (profile?.role === 'admin') {
    items.push({ label: 'Yönetim', items: [{ to: '/users', label: 'Kullanıcı Yönetimi', icon: ShieldCheck }, { to: '/time-settings', label: 'Zaman Ayarları', icon: SlidersHorizontal }] })
  }

  const sidebarContent = (
    <>
      <div className="px-5 pt-5 pb-7">
        <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'} className={'flex items-center gap-3 w-full text-left ' + (collapsed ? 'justify-center' : '')}>
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-teal-300 via-teal-500 to-cyan-700 flex items-center justify-center text-white shadow-lg shadow-teal-950/20 shrink-0"><BookMarked size={20} strokeWidth={2.5} /></div>
          {!collapsed && <div className="min-w-0"><p className="font-bold text-white text-[17px] leading-tight">EduShift</p><p className="text-[10px] tracking-[.18em] text-slate-400 font-semibold mt-1">SCHOOL OPS</p></div>}
        </button>
      </div>
      <nav className={'flex-1 px-3 overflow-y-auto ' + (collapsed ? 'space-y-3' : 'space-y-5')}>
        {items.map((group) => <div key={group.label}>
          {!collapsed && <p className="px-3 mb-2 text-[10px] tracking-[.16em] text-slate-500 font-bold">{group.label}</p>}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to
              return <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined} className={'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ' + (collapsed ? 'justify-center' : '') + (active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white')}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-teal-600' : 'text-slate-500 group-hover:text-teal-300'} />
                {!collapsed && <><span className="flex-1">{item.label}</span>{item.accent && !active && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}{active && <ChevronRight size={14} className="text-slate-400" />}</>}
              </Link>
            })}
          </div>
        </div>)}
      </nav>
      <div className="px-3 pb-4 pt-5">
        {!collapsed && <div className="rounded-2xl bg-white/7 border border-white/8 p-3 mb-3"><div className="flex items-center gap-2 text-teal-300 mb-1"><Sparkles size={14} /><span className="text-[10px] tracking-widest font-bold">İPUCU</span></div><p className="text-xs text-slate-400 leading-relaxed">Programı yayınlamadan önce tüm uyarıları kontrol et.</p></div>}
        <div className={'flex items-center gap-3 px-2 py-2 ' + (collapsed ? 'justify-center' : '')}><div className="w-9 h-9 rounded-full bg-teal-400/15 border border-teal-300/20 flex items-center justify-center text-teal-200 font-bold text-xs shrink-0">{initials}</div>{!collapsed && <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Kullanıcı'}</p><p className="text-xs text-slate-500 mt-0.5">{roleLabels[profile?.role] || profile?.role}</p></div>}</div>
        <button onClick={signOut} title="Çıkış yap" className={'mt-2 flex items-center gap-2 text-xs text-slate-500 hover:text-rose-300 transition-colors px-2 ' + (collapsed ? 'justify-center w-full' : '')}><LogOut size={14} />{!collapsed && 'Çıkış Yap'}</button>
      </div>
    </>
  )

  return <div className="min-h-screen flex bg-[#f6f8fb]">
    <aside className={'hidden md:flex flex-col bg-[#111c35] transition-all duration-200 shrink-0 ' + (collapsed ? 'w-[76px]' : 'w-[252px]')}>{sidebarContent}</aside>
    {mobileOpen && <div className="md:hidden fixed inset-0 z-50 flex"><div className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} /><aside className="relative w-[280px] bg-[#111c35] flex flex-col shadow-2xl"><button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 text-slate-400 hover:text-white"><X size={20} /></button>{sidebarContent}</aside></div>}
    <main className="flex-1 flex flex-col min-w-0">
      <header className="h-[72px] bg-white/80 backdrop-blur border-b border-slate-200/70 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><Menu size={19} /></button><div><p className="text-[11px] uppercase tracking-[.14em] text-slate-400 font-bold">Haftalık planlama</p><h1 className="text-base font-bold text-slate-800">{currentPage}</h1></div></div>
        <div className="hidden sm:flex items-center gap-4"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Sistem çalışıyor</div><button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100" title="Yardım"><CircleHelp size={18} /></button></div>
      </header>
      <div className="flex-1 overflow-y-auto"><Outlet /></div>
    </main>
  </div>
}
