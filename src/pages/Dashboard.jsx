import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Layers, ShieldCheck, AlertTriangle, CalendarClock, UserCheck, Gauge, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

const MAX_HEALTHY_WEEKLY_HOURS = 30

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, courses: 0, branches: 0, constraints: 0 })
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [scheduleCount, setScheduleCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])
  async function fetchAll() {
    const results = await Promise.all([
      supabase.from('teachers').select('id, full_name'), supabase.from('courses').select('id, course_name'),
      supabase.from('branches').select('*', { count: 'exact', head: true }), supabase.from('teacher_constraints').select('*', { count: 'exact', head: true }),
      supabase.from('course_assignments').select('id, course_id, teacher_id, weekly_hours'), supabase.from('schedules').select('id', { count: 'exact', head: true }),
    ])
    const teachersData = results[0].data || []; const coursesData = results[1].data || []
    setTeachers(teachersData); setCourses(coursesData)
    setStats({ teachers: teachersData.length, courses: coursesData.length, branches: results[2].count || 0, constraints: results[3].count || 0 })
    setAssignments(results[4].data || []); setScheduleCount(results[5].count || 0); setLoading(false)
  }

  const totalRequiredHours = assignments.reduce((sum, a) => sum + (a.weekly_hours || 0), 0)
  const cappedScheduleCount = Math.min(scheduleCount, totalRequiredHours)
  const placedPercent = totalRequiredHours > 0 ? Math.round((cappedScheduleCount / totalRequiredHours) * 100) : 0
  const remainingBlocks = Math.max(totalRequiredHours - scheduleCount, 0)
  const assignedCourseIds = new Set(assignments.map((a) => a.course_id))
  const coursesWithoutTeacher = courses.filter((c) => !assignedCourseIds.has(c.id))
  const hoursByTeacher = {}
  assignments.forEach((a) => { hoursByTeacher[a.teacher_id] = (hoursByTeacher[a.teacher_id] || 0) + (a.weekly_hours || 0) })
  const overloadedTeachers = teachers.filter((t) => (hoursByTeacher[t.id] || 0) > MAX_HEALTHY_WEEKLY_HOURS)
  const warningCount = (remainingBlocks > 0 ? 1 : 0) + (coursesWithoutTeacher.length > 0 ? 1 : 0) + (overloadedTeachers.length > 0 ? 1 : 0)
  const readiness = totalRequiredHours > 0 ? Math.max(0, Math.round(placedPercent * .65 + (coursesWithoutTeacher.length === 0 ? 20 : 0) + (overloadedTeachers.length === 0 ? 15 : 0))) : 0

  const cards = [
    { label: 'Öğretmenler', value: stats.teachers, sub: 'Aktif kadro', icon: Users, tone: 'teal' },
    { label: 'Dersler', value: stats.courses, sub: 'Tanımlı ders', icon: BookOpen, tone: 'violet' },
    { label: 'Şubeler', value: stats.branches, sub: 'Programlanacak sınıf', icon: Layers, tone: 'amber' },
    { label: 'Kısıtlar', value: stats.constraints, sub: 'Müsait olmayan zaman', icon: CalendarClock, tone: 'rose' },
  ]
  const toneMap = { teal: 'bg-teal-50 text-teal-700', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' }

  const attentionItems = [
    remainingBlocks > 0 ? { icon: CalendarClock, title: remainingBlocks + ' ders saati yerleşmedi', sub: 'Programı aç ve boş hücreleri tamamla', tone: 'warn', to: '/schedule' } : { icon: CheckCircle2, title: 'Tüm ders saatleri yerleşti', sub: 'Program yayınlanmaya hazır görünüyor', tone: 'ok' },
    coursesWithoutTeacher.length > 0 ? { icon: UserCheck, title: coursesWithoutTeacher.length + ' dersin öğretmeni yok', sub: coursesWithoutTeacher.slice(0, 2).map((c) => c.course_name).join(', '), tone: 'warn', to: '/assignments' } : { icon: UserCheck, title: 'Tüm derslerin sahibi var', sub: 'Atama tarafında eksik görünmüyor', tone: 'ok' },
    overloadedTeachers.length > 0 ? { icon: Gauge, title: overloadedTeachers.length + ' öğretmenin yükü yüksek', sub: overloadedTeachers.slice(0, 2).map((t) => t.full_name).join(', '), tone: 'warn', to: '/assignments' } : { icon: Gauge, title: 'Öğretmen yükü dengeli', sub: '30 saat üzerinde çalışan yok', tone: 'ok' },
  ]

  return <div className="p-4 md:p-8 max-w-[1500px] mx-auto">
    <PageHeader title={'Günaydın, ' + (profile?.full_name?.split(' ')[0] || 'Müdür')} subtitle="Bu haftanın programını tek bakışta kontrol et, riskleri yayınlamadan önce çöz." />

    <section className="relative overflow-hidden rounded-[26px] bg-[#111c35] p-6 md:p-8 mb-6 shadow-xl shadow-slate-900/10">
      <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl" /><div className="absolute right-24 -bottom-36 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-7">
        <div className="max-w-xl"><div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-[.16em] mb-4"><ShieldCheck size={15} /> Haftalık hazırlık</div><h2 className="text-2xl md:text-3xl font-bold text-white">Programın yayınlama durumu</h2><p className="text-slate-400 text-sm mt-3 leading-relaxed">Müdür gözüyle kritik kontroller tamamlanmadan programı paylaşma. Aşağıdaki skor, mevcut verilerindeki hazırlık seviyesini özetler.</p><Link to="/schedule" className="inline-flex items-center gap-2 mt-5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm px-4 py-2.5 transition-colors">Programı gözden geçir <ArrowRight size={16} /></Link></div>
        <div className="flex items-center gap-5 shrink-0"><div className="relative w-32 h-32"><svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 15.5} strokeDashoffset={2 * Math.PI * 15.5 * (1 - readiness / 100)} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-white">{readiness}%</span><span className="text-[9px] uppercase tracking-widest text-slate-400">hazır</span></div></div><div className="text-sm"><p className="text-white font-semibold">{warningCount === 0 ? 'Paylaşmaya hazır' : warningCount + ' kontrol bekliyor'}</p><p className="text-slate-400 mt-1">{cappedScheduleCount} / {totalRequiredHours || 0} saat yerleşti</p></div></div>
      </div>
    </section>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="bg-white border border-slate-200/70 rounded-2xl p-4 md:p-5 shadow-soft shadow-soft-hover"><div className="flex justify-between items-start"><div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + toneMap[card.tone]}><Icon size={19} /></div><span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">canlı</span></div><p className="text-2xl md:text-3xl font-bold text-slate-900 mt-5">{loading ? '—' : card.value}</p><p className="text-sm font-semibold text-slate-700 mt-1">{card.label}</p><p className="text-xs text-slate-400 mt-0.5">{card.sub}</p></div> })}</div>

    <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-5">
      <PageCard title="Yayınlama kontrol listesi" description="Programı öğretmenlerle paylaşmadan önce son durum">
        <div className="space-y-2 mt-4">{attentionItems.map((item, index) => { const Icon = item.icon; const ok = item.tone === 'ok'; const content = <div className={'flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ' + (ok ? 'bg-emerald-50/60 border-emerald-100' : 'bg-amber-50/70 border-amber-100 hover:bg-amber-100')}><div className={'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ' + (ok ? 'bg-white text-emerald-600' : 'bg-white text-amber-600')}><Icon size={17} /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800">{item.title}</p><p className="text-xs text-slate-500 mt-0.5 truncate">{item.sub}</p></div>{ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <ArrowRight size={16} className="text-amber-500" />}</div>; return item.to ? <Link key={index} to={item.to}>{content}</Link> : <div key={index}>{content}</div> })}</div>
      </PageCard>
      <PageCard title="Bu haftanın özeti" description="Operasyonun hızlı görünümü">
        <div className="grid grid-cols-2 gap-3 mt-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Yerleşen saat</p><p className="text-2xl font-bold text-slate-900 mt-2">{cappedScheduleCount}</p><div className="h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{ width: placedPercent + '%' }} /></div></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Eksik blok</p><p className="text-2xl font-bold text-slate-900 mt-2">{remainingBlocks}</p><p className="text-xs text-slate-400 mt-3">Tamamlanmayı bekliyor</p></div></div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-slate-500"><Circle size={10} className="fill-teal-500 text-teal-500" /> Veriler gerçek zamanlı</div><Link to="/schedule" className="text-sm font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1">Takvime git <ArrowRight size={15} /></Link></div>
      </PageCard>
    </div>
  </div>
}
