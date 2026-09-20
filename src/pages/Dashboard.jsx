import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import { AlertTriangle, ArrowUpRight, CheckCircle2, CalendarClock, Users, BookOpen, Layers, ShieldCheck } from '../components/UiMarks'

const MAX_HEALTHY_WEEKLY_HOURS = 30
const formatDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, courses: 0, branches: 0, constraints: 0 })
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [scheduleCount, setScheduleCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const results = await Promise.all([
      supabase.from('teachers').select('id, full_name'),
      supabase.from('courses').select('id, course_name'),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase.from('teacher_constraints').select('*', { count: 'exact', head: true }),
      supabase.from('course_assignments').select('id, course_id, teacher_id, weekly_hours'),
      supabase.from('schedules').select('id', { count: 'exact', head: true }),
    ])
    const teacherData = results[0].data || []
    const courseData = results[1].data || []
    setTeachers(teacherData)
    setCourses(courseData)
    setStats({ teachers: teacherData.length, courses: courseData.length, branches: results[2].count || 0, constraints: results[3].count || 0 })
    setAssignments(results[4].data || [])
    setScheduleCount(results[5].count || 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchAll)
  }, [fetchAll])

  const totalRequiredHours = assignments.reduce((sum, assignment) => sum + (assignment.weekly_hours || 0), 0)
  const placed = Math.min(scheduleCount, totalRequiredHours)
  const remaining = Math.max(totalRequiredHours - scheduleCount, 0)
  const assignedCourseIds = new Set(assignments.map((assignment) => assignment.course_id))
  const coursesWithoutTeacher = courses.filter((course) => !assignedCourseIds.has(course.id))
  const hoursByTeacher = {}
  assignments.forEach((assignment) => {
    hoursByTeacher[assignment.teacher_id] = (hoursByTeacher[assignment.teacher_id] || 0) + (assignment.weekly_hours || 0)
  })
  const overloadedTeachers = teachers.filter((teacher) => (hoursByTeacher[teacher.id] || 0) > MAX_HEALTHY_WEEKLY_HOURS)
  const ready = remaining === 0 && coursesWithoutTeacher.length === 0 && overloadedTeachers.length === 0
  const completion = totalRequiredHours ? Math.round((placed / totalRequiredHours) * 100) : 0
  const checks = [
    { label: 'Ders saatleri yerleşimi', value: remaining === 0 ? 'Tamamlandı' : `${remaining} saat eksik`, detail: `${placed} / ${totalRequiredHours || 0} saat yerleşti`, to: '/schedule', good: remaining === 0 },
    { label: 'Ders ve öğretmen eşleşmesi', value: coursesWithoutTeacher.length === 0 ? 'Tamamlandı' : `${coursesWithoutTeacher.length} ders eksik`, detail: coursesWithoutTeacher.length ? coursesWithoutTeacher.slice(0, 2).map((course) => course.course_name).join(', ') : 'Tüm derslerin sorumlusu var', to: '/assignments', good: coursesWithoutTeacher.length === 0 },
    { label: 'Öğretmen haftalık yükü', value: overloadedTeachers.length === 0 ? 'Dengeli' : `${overloadedTeachers.length} kayıt incelenmeli`, detail: overloadedTeachers.length ? overloadedTeachers.slice(0, 2).map((teacher) => teacher.full_name).join(', ') : `Her öğretmen ${MAX_HEALTHY_WEEKLY_HOURS} saat altında`, to: '/assignments', good: overloadedTeachers.length === 0 },
  ]
  const summary = [
    { label: 'Öğretmen', value: stats.teachers, icon: Users, tone: 'blue' },
    { label: 'Ders', value: stats.courses, icon: BookOpen, tone: 'lime' },
    { label: 'Şube', value: stats.branches, icon: Layers, tone: 'coral' },
    { label: 'Kısıt', value: stats.constraints, icon: ShieldCheck, tone: 'slate' },
  ]

  return (
    <div className="page-canvas">
      <div className="page-width">
        <PageHeader title={`Merhaba, ${profile?.full_name?.split(' ')[0] || 'Müdür'}`} subtitle={`${formatDate.format(new Date())} · Haftalık programın yayınlama dosyası`} eyebrow="Çalışma alanı" />

        <motion.section className="dashboard-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.2, .8, .2, 1] }}>
          <div>
            <p className="section-kicker">Dosya durumu / yayın öncesi kontrol</p>
            <h2>{ready ? 'Program yayınlanmaya hazır.' : 'Yayın öncesi kontroller sürüyor.'}</h2>
            <p className="dashboard-hero-copy">Bu ekran okulun haftalık programını paylaşmadan önce müdürün görmesi gereken eksikleri tek sırada toplar. Her satır seni doğrudan ilgili düzeltmeye götürür.</p>
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <Link to="/schedule" className="primary-button">Program dosyasını aç <ArrowUpRight size={16} /></Link>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[var(--muted)]"><CalendarClock size={15} /> Haftalık görünüm</span>
            </div>
          </div>
          <div className="dashboard-score">
            <p className="dashboard-score-value">{loading ? '—' : `${completion}%`}</p>
            <p className="dashboard-score-label">yerleşim tamamlandı</p>
            <p className="dashboard-score-label">{ready ? 'son kontrol bekliyor' : `${checks.filter((check) => !check.good).length} kontrol açık`}</p>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
          {summary.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="surface p-4 flex items-center justify-between">
                <div><p className="text-[11px] font-bold text-[var(--muted)]">{item.label}</p><p className="text-2xl font-extrabold tracking-tight text-[var(--ink)] mt-2">{loading ? '—' : item.value}</p></div>
                <span className={'w-10 h-10 rounded-xl flex items-center justify-center bg-' + item.tone}><Icon size={18} /></span>
              </div>
            )
          })}
        </section>

        <section className="checklist" aria-labelledby="checklist-title">
          <div className="checklist-head"><span>No.</span><span id="checklist-title">Kontrol</span><span>Kanıt</span><span>Durum</span></div>
          {checks.map((check, index) => (
            <Link key={check.label} to={check.to} className="checklist-row">
              <span className="checklist-number">0{index + 1}</span>
              <span><span className="checklist-title">{check.label}</span><span className="checklist-detail">{check.detail}</span></span>
              <span className="checklist-value">{check.value}</span>
              <span className={'checklist-status ' + (check.good ? 'is-good' : 'is-alert')}>
                {check.good ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {check.good ? 'uygun' : 'incele'}
              </span>
            </Link>
          ))}
        </section>

        <div className="dashboard-lower">
          <section className="surface dashboard-panel">
            <div className="dashboard-panel-head"><div><h2 className="dashboard-panel-title">Okul özeti</h2><p className="dashboard-panel-description">Sistemde kayıtlı operasyon verisi</p></div><CalendarClock size={18} color="var(--cobalt)" /></div>
            <dl className="dashboard-list">
              {summary.map((item) => <div key={item.label} className="dashboard-list-row"><dt>{item.label}</dt><dd>{loading ? '—' : item.value}</dd></div>)}
            </dl>
          </section>
          <section className="surface dashboard-panel dashboard-next">
            <div><div className="dashboard-panel-head"><div><h2 className="dashboard-panel-title">Sıradaki karar</h2><p className="dashboard-panel-description">Dosyanın kapanması için önerilen adım</p></div><ArrowUpRight size={18} color="var(--coral)" /></div><p className="dashboard-next-copy">{ready ? 'Programı paylaşmadan önce son görünümü ve PDF çıktısını kontrol et. Hazır olduğunda program oluşturucudan yayına geçebilirsin.' : 'Önce program oluşturucuda boş saatleri tamamla. Ardından atamaları ve öğretmen yüklerini tekrar kontrol et.'}</p></div>
            <Link to="/schedule" className="text-button">Program dosyasını aç <ArrowUpRight size={14} /></Link>
          </section>
        </div>

        <footer className="dashboard-footer"><span>EduShift · Okul operasyon merkezi</span><a href="/terms">Şartlar</a><a href="/privacy">Gizlilik</a></footer>
      </div>
    </div>
  )
}
