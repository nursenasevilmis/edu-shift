import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, RefreshCw, LogOut, CalendarDays } from '../components/UiMarks'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import { DAYS } from '../utils/timeUtils'
import { useToast } from '../contexts/ToastContext'

export default function TeacherPanel() {
  const { signOut, user } = useAuth()
  const [teacherRecord, setTeacherRecord] = useState(null)
  const [scheduleEntries, setScheduleEntries] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const tableRef = useRef(null)
  const toast = useToast()

  const fetchTeacherAndSchedule = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: teacher, error: teacherError } = await supabase.from('teachers').select('*, branches(name)').eq('user_id', user.id).single()
    if (teacherError || !teacher) {
      console.error('Öğretmen kaydı bulunamadı:', teacherError)
      setLoading(false)
      return
    }
    setTeacherRecord(teacher)
    const [{ data: slots }, { data: entries, error: entriesError }] = await Promise.all([
      supabase.from('time_slots').select('*').order('day_of_week').order('period_number'),
      supabase.from('schedules').select('*, course_assignments!inner(teacher_id, courses(course_name)), branches(name)').eq('course_assignments.teacher_id', teacher.id),
    ])
    setTimeSlots(slots || [])
    if (entriesError) console.error('Program alınamadı:', entriesError)
    else setScheduleEntries(entries || [])
    setLoading(false)
  }, [user])

  useEffect(() => { void Promise.resolve().then(fetchTeacherAndSchedule) }, [fetchTeacherAndSchedule])

  const maxPeriods = Math.max(1, ...DAYS.map((day) => timeSlots.filter((slot) => slot.day_of_week === day.value).length))
  const today = new Date().getDay() || 7
  const todayLabel = DAYS.find((day) => day.value === today)?.label || 'Hafta'
  const todayEntries = scheduleEntries.filter((entry) => entry.time_slots?.day_of_week === today)
  const weekHours = scheduleEntries.length
  const nextEntry = scheduleEntries.find((entry) => entry.time_slots?.day_of_week === today)

  const daySummary = useMemo(() => DAYS.map((day) => ({ ...day, count: scheduleEntries.filter((entry) => entry.time_slots?.day_of_week === day.value).length })), [scheduleEntries])

  function getSlotFor(day, periodNumber) { return timeSlots.find((slot) => slot.day_of_week === day && slot.period_number === periodNumber) }
  function findEntry(slotId) { return scheduleEntries.find((entry) => entry.time_slot_id === slotId) }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchTeacherAndSchedule()
    setRefreshing(false)
    toast.success('Program güncellendi.')
  }

  async function handleDownloadPdf() {
    if (!tableRef.current || !teacherRecord) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth() - 20
      const pageHeight = pdf.internal.pageSize.getHeight() - 20
      const width = Math.min(pageWidth, (canvas.width * pageHeight) / canvas.height)
      const height = (canvas.height * width) / canvas.width
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pdf.internal.pageSize.getWidth() - width) / 2, (pdf.internal.pageSize.getHeight() - height) / 2, width, height)
      pdf.save(teacherRecord.full_name.replace(/\s+/g, '_') + '_program.pdf')
      toast.success('Program PDF olarak indirildi.')
    } catch (error) {
      toast.error('PDF oluşturulamadı: ' + error.message)
    }
    setExporting(false)
  }

  if (loading) return <div className="teacher-shell"><div className="teacher-loading"><div className="teacher-loading-line" /><div className="teacher-loading-grid" /></div></div>

  if (!teacherRecord) return <div className="teacher-shell"><div className="teacher-empty"><p>Bu hesaba bağlı öğretmen kaydı bulunamadı.</p><span>Yönetici hesabından öğretmen profilinin bu kullanıcıya bağlandığını kontrol et.</span><button type="button" className="secondary-button" onClick={signOut}>Çıkış yap</button></div></div>

  return (
    <div className="teacher-shell">
      <header className="teacher-header">
        <div className="teacher-brand"><span className="brand-chip">ES</span><span><strong>EduShift</strong><small>School operations</small></span></div>
        <div className="teacher-header-actions"><button type="button" className="secondary-button" onClick={handleRefresh} disabled={refreshing}><RefreshCw size={15} /> {refreshing ? 'Yenileniyor' : 'Yenile'}</button><button type="button" className="primary-button" onClick={handleDownloadPdf} disabled={exporting}><Download size={15} /> {exporting ? 'Hazırlanıyor' : 'PDF indir'}</button><button type="button" className="teacher-signout" onClick={signOut}><LogOut size={15} /> Çıkış</button></div>
      </header>
      <main className="teacher-main">
        <div className="teacher-intro"><div><p className="section-kicker">Öğretmen çalışma alanı</p><h1>Merhaba, {teacherRecord.full_name.split(' ')[0]}.</h1><p>{teacherRecord.branches?.name || 'Okul programın'} · Haftalık ders akışın</p></div><CalendarDays size={28} /></div>
        <div className="teacher-summary"><div><span>Bu hafta</span><strong>{weekHours}</strong><small>ders saati</small></div><div><span>Bugün · {todayLabel}</span><strong>{todayEntries.length}</strong><small>ders</small></div><div><span>Sonraki ders</span><strong>{nextEntry?.time_slots?.start_time?.slice(0, 5) || '—'}</strong><small>{nextEntry?.course_assignments?.courses?.course_name || 'Programda ders yok'}</small></div></div>
        <section className="teacher-week-strip">{daySummary.map((day) => <div key={day.value} className={day.value === today ? 'is-today' : ''}><span>{day.label.slice(0, 3)}</span><strong>{day.count}</strong></div>)}</section>
        <section className="teacher-schedule-surface" ref={tableRef}><div className="teacher-surface-head"><div><h2>Haftalık program</h2><p>Günlük ders akışını ve bağlı şubeleri görüntüle.</p></div><span className="teacher-surface-date">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          {scheduleEntries.length === 0 ? <div className="teacher-no-schedule"><strong>Henüz yayınlanmış program yok.</strong><span>Program yöneticiniz tarafından oluşturulduğunda burada görünecek.</span></div> : <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr><th>Saat</th>{DAYS.map((day) => <th key={day.value} className={day.value === today ? 'is-today' : ''}>{day.label}</th>)}</tr></thead><tbody>{Array.from({ length: maxPeriods }, (_, index) => index + 1).map((periodNumber) => <tr key={periodNumber}><td>{periodNumber}. ders</td>{DAYS.map((day) => { const slot = getSlotFor(day.value, periodNumber); if (!slot) return <td key={day.value} className="is-disabled" />; const entry = findEntry(slot.id); return <td key={day.value} className={(entry ? 'has-entry ' : '') + (day.value === today ? 'is-today ' : '')}><small>{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</small>{entry && <><strong>{entry.course_assignments?.courses?.course_name}</strong><span>{entry.branches?.name}</span></>}</td> })}</tr>)}</tbody></table></div>}
        </section>
      </main>
    </div>
  )
}
