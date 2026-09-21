import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import { AlertTriangle, ArrowUpRight, CheckCircle2, CalendarClock } from '../components/UiMarks'

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
  const openChecks = [remaining > 0, coursesWithoutTeacher.length > 0, overloadedTeachers.length > 0].filter(Boolean).length

  const checks = [
    { label: 'Ders saatleri yerleşimi', value: remaining === 0 ? 'Tamamlandı' : `${remaining} saat eksik`, detail: `${placed} / ${totalRequiredHours || 0} saat yerleşti`, to: '/schedule', good: remaining === 0 },
    { label: 'Ders ve öğretmen eşleşmesi', value: coursesWithoutTeacher.length === 0 ? 'Tamamlandı' : `${coursesWithoutTeacher.length} ders eksik`, detail: coursesWithoutTeacher.length ? coursesWithoutTeacher.slice(0, 2).map((course) => course.course_name).join(', ') : 'Tüm derslerin sorumlusu var', to: '/assignments', good: coursesWithoutTeacher.length === 0 },
    { label: 'Öğretmen haftalık yükü', value: overloadedTeachers.length === 0 ? 'Dengeli' : `${overloadedTeachers.length} kayıt incelenmeli`, detail: overloadedTeachers.length ? overloadedTeachers.slice(0, 2).map((teacher) => teacher.full_name).join(', ') : `Her öğretmen ${MAX_HEALTHY_WEEKLY_HOURS} saat altında`, to: '/assignments', good: overloadedTeachers.length === 0 },
  ]

  return (
    <div className="page-canvas">
      <div className="page-width">
        <PageHeader title="Program durumu" subtitle={`${formatDate.format(new Date())} · ${profile?.full_name || 'Okul yönetimi'}`} eyebrow="Haftalık program" />

        <section className="ops-status" aria-labelledby="ops-status-title">
          <div className="ops-status-main">
            <span className={'ops-status-mark ' + (ready ? 'is-ready' : 'is-open')} aria-hidden="true" />
            <div>
              <p className="ops-status-label">Yayın öncesi kontrol</p>
              <h2 id="ops-status-title">{ready ? 'Program yayınlanmaya hazır.' : 'Programda açık kontroller var.'}</h2>
              <p>{ready ? 'Son görünümü kontrol edip program dosyasını paylaşabilirsin.' : 'Aşağıdaki kontroller doğrudan ilgili düzenleme ekranına götürür.'}</p>
            </div>
          </div>
          <div className="ops-metrics" aria-label="Program özet bilgileri">
            <div className="ops-metric"><span>Yerleşim</span><strong>{loading ? '—' : `${placed}/${totalRequiredHours || 0}`}</strong></div>
            <div className="ops-metric"><span>Açık uyarı</span><strong>{loading ? '—' : openChecks}</strong></div>
            <div className="ops-metric"><span>Ders</span><strong>{loading ? '—' : stats.courses}</strong></div>
            <div className="ops-metric"><span>Öğretmen</span><strong>{loading ? '—' : stats.teachers}</strong></div>
          </div>
        </section>

        <div className="ops-layout">
          <section className="ops-checks" aria-labelledby="checks-title">
            <div className="ops-section-head"><div><p className="section-kicker">Kontrol listesi</p><h2 id="checks-title">Programı yayına hazırlama</h2></div><Link to="/schedule" className="text-button">Programı aç <ArrowUpRight size={14} /></Link></div>
            <div className="checklist">
              <div className="checklist-head"><span>No.</span><span>Kontrol</span><span>Kanıt</span><span>Durum</span></div>
              {checks.map((check, index) => (
                <Link key={check.label} to={check.to} className="checklist-row">
                  <span className="checklist-number">0{index + 1}</span>
                  <span><span className="checklist-title">{check.label}</span><span className="checklist-detail">{check.detail}</span></span>
                  <span className="checklist-value">{check.value}</span>
                  <span className={'checklist-status ' + (check.good ? 'is-good' : 'is-alert')}>{check.good ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{check.good ? 'uygun' : 'incele'}</span>
                </Link>
              ))}
            </div>
          </section>

          <aside className="ops-aside">
            <section className="ops-aside-section">
              <div className="ops-section-head"><div><p className="section-kicker">Okul kaydı</p><h2>Veri özeti</h2></div><CalendarClock size={17} color="var(--muted)" /></div>
              <dl className="dashboard-list">
                <div className="dashboard-list-row"><dt>Şube</dt><dd>{loading ? '—' : stats.branches}</dd></div>
                <div className="dashboard-list-row"><dt>Ders</dt><dd>{loading ? '—' : stats.courses}</dd></div>
                <div className="dashboard-list-row"><dt>Öğretmen</dt><dd>{loading ? '—' : stats.teachers}</dd></div>
                <div className="dashboard-list-row"><dt>Kısıt</dt><dd>{loading ? '—' : stats.constraints}</dd></div>
              </dl>
            </section>
            <section className="ops-aside-section ops-next-step"><p className="section-kicker">Sonraki işlem</p><h2>{ready ? 'Son görünümü kontrol et.' : 'Açık kontrolleri tamamla.'}</h2><p>{ready ? 'Program oluşturucudan haftalık gridin son halini ve çıktı görünümünü kontrol et.' : 'Bir kontrol satırına tıklayarak doğrudan ilgili kayıt ekranına geç.'}</p><Link to="/schedule" className="primary-button">Program oluşturucuya git <ArrowUpRight size={15} /></Link></section>
          </aside>
        </div>

        <footer className="dashboard-footer"><span>EduShift · Okul operasyon merkezi</span><a href="/terms">Şartlar</a><a href="/privacy">Gizlilik</a></footer>
      </div>
    </div>
  )
}
