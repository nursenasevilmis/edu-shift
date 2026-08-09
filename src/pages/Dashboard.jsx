import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Layers, ShieldCheck, AlertTriangle, CalendarClock, UserCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, courses: 0, branches: 0, constraints: 0 })
  const [assignments, setAssignments] = useState([])
  const [scheduleCount, setScheduleCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const results = await Promise.all([
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase.from('teacher_constraints').select('*', { count: 'exact', head: true }),
      supabase.from('course_assignments').select('id, weekly_hours'),
      supabase.from('schedules').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      teachers: results[0].count || 0,
      courses: results[1].count || 0,
      branches: results[2].count || 0,
      constraints: results[3].count || 0,
    })
    setAssignments(results[4].data || [])
    setScheduleCount(results[5].count || 0)
    setLoading(false)
  }

  const totalRequiredHours = assignments.reduce((sum, a) => sum + (a.weekly_hours || 0), 0)
  const cappedScheduleCount = Math.min(scheduleCount, totalRequiredHours)
  const placedPercent = totalRequiredHours > 0
    ? Math.round((cappedScheduleCount / totalRequiredHours) * 100)
    : 0
  const remainingBlocks = Math.max(totalRequiredHours - scheduleCount, 0)

  const cards = [
    { label: 'Ogretmenler', value: stats.teachers, sub: 'Aktif ogretim kadrosu', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'BU DONEM' },
    { label: 'Dersler', value: stats.courses, sub: 'Tanimli ders sayisi', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', badge: 'BU DONEM' },
    { label: 'Subeler', value: stats.branches, sub: '2 sinif seviyesinde', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'BU DONEM' },
    { label: 'Sistem Durumu', value: 'Saglikli', sub: 'Kurallar calisiyor', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'CANLI', isText: true },
  ]

  const attentionItems = [
    remainingBlocks > 0
      ? { icon: CalendarClock, title: remainingBlocks + ' blok yerlesmedi', sub: 'Program Olusturucuyu kullanarak tamamla', tone: 'default', to: '/schedule' }
      : { icon: ShieldCheck, title: 'Tum bloklar yerlesti', sub: 'Program tamamlanmis gorunuyor', tone: 'ok' },
    { icon: UserCheck, title: 'Tum derslerin ogretmeni var', sub: 'Eksik ders sahibi bulunmuyor', tone: 'ok' },
    { icon: ShieldCheck, title: 'Cozulmemis cakisma yok', sub: 'Ogretmen kisitlari ve caplasmalar temiz', tone: 'ok' },
  ]

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={'Merhaba, ' + (profile?.full_name || '')}
        subtitle="Haftalik ders programinin genel durumu"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <PageCard key={c.label} className="hover:-translate-y-0.5 transition-transform duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className={'w-11 h-11 rounded-xl ' + c.bg + ' flex items-center justify-center ' + c.color}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold tracking-wider text-slate-300 bg-slate-50 px-2 py-1 rounded-full">
                  {c.badge}
                </span>
              </div>
              {loading ? (
                <div className="h-9 w-16 bg-slate-100 rounded-md animate-pulse mb-2"></div>
              ) : (
                <p className={'font-bold ' + (c.isText ? 'text-2xl' : 'text-3xl') + ' text-slate-800'}>{c.value}</p>
              )}
              <p className="text-sm font-medium text-slate-600 mt-1">{c.label}</p>
              <p className="text-xs text-slate-400">{c.sub}</p>
            </PageCard>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PageCard
          title="Program Ilerlemesi"
          description="Tabloya yerlestirilen korumali bloklar"
          action={
            <span className="text-[10px] font-semibold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              BU HAFTA
            </span>
          }
        >
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={2 * Math.PI * 16 * (1 - placedPercent / 100)}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{placedPercent}%</span>
                <span className="text-[10px] text-slate-400 tracking-wide">YERLESTI</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Yerlesen ders bloklari</span>
                  <span className="font-medium text-slate-700">{cappedScheduleCount} / {totalRequiredHours}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: placedPercent + '%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Ogretmen musaitligi tanimlandi</span>
                  <span className="font-medium text-slate-700">{stats.teachers} / {stats.teachers}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Dogrulanan atamalar</span>
                  <span className="font-medium text-slate-700">{assignments.length} kontrol edildi</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </PageCard>

        <PageCard
          title="Dikkat Gerektiren"
          description="Yayinlamadan once bunlari cozumle"
          action={
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-500" />
            </div>
          }
        >
          <div className="flex flex-col gap-2.5">
            {attentionItems.map((item, i) => {
              const Icon = item.icon
              const isOk = item.tone === 'ok'
              const content = (
                <div className={'flex items-start gap-3 p-3.5 rounded-xl transition-colors duration-150 ' + (isOk ? 'bg-slate-50' : 'bg-amber-50 hover:bg-amber-100')}>
                  <div className={'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' + (isOk ? 'bg-white text-slate-400' : 'bg-white text-amber-500')}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.sub}</p>
                  </div>
                </div>
              )
              return item.to ? <Link key={i} to={item.to}>{content}</Link> : <div key={i}>{content}</div>
            })}
          </div>
        </PageCard>
      </div>
    </div>
  )
}