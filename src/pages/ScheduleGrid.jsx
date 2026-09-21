import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DAYS, computeBlockState } from '../utils/timeUtils'
import SelectField from '../components/SelectField'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { Wand2, Trash2, Info } from '../components/UiMarks'
import { generateAutoSchedule } from '../utils/autoSchedule'

export default function ScheduleGrid() {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [assignments, setAssignments] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [scheduleEntries, setScheduleEntries] = useState([])
  const [constraints, setConstraints] = useState([])
  const [dragOverCell, setDragOverCell] = useState(null)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    fetchBranches()
    fetchTimeSlots()
    fetchConstraints()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchAssignments(selectedBranch)
      fetchSchedule(selectedBranch)
    }
  }, [selectedBranch])

  async function fetchBranches() {
    const { data, error } = await supabase.from('branches').select('*').order('id')
    if (error) console.error(error)
    else {
      setBranches(data)
      if (data.length > 0) setSelectedBranch(String(data[0].id))
    }
  }

  async function fetchTimeSlots() {
    setFetching(true)
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('day_of_week')
      .order('period_number')
    if (error) console.error(error)
    else setTimeSlots(data)
    setFetching(false)
  }

  async function fetchConstraints() {
    const { data, error } = await supabase.from('teacher_constraints').select('*')
    if (error) console.error(error)
    else setConstraints(data)
  }

  async function fetchAssignments(branchId) {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('*, courses(course_name), teachers(full_name)')
      .eq('branch_id', branchId)
    if (error) console.error(error)
    else setAssignments(data)
  }

  async function fetchSchedule(branchId) {
    const { data, error } = await supabase
      .from('schedules')
      .select(
        '*, course_assignments(*, courses(course_name), teachers(full_name)), time_slots(day_of_week, period_number, start_time, end_time)'
      )
      .eq('branch_id', branchId)
    if (error) console.error(error)
    else setScheduleEntries(data)
  }

  const maxPeriods = Math.max(
    1,
    ...DAYS.map((d) => timeSlots.filter((s) => s.day_of_week === d.value).length)
  )

  function getSlotFor(day, periodNumber) {
    return timeSlots.find((s) => s.day_of_week === day && s.period_number === periodNumber)
  }

  function findScheduleEntry(slotId) {
    return scheduleEntries.find((s) => s.time_slot_id === slotId)
  }

  // assignment_id -> zenginleştirilmiş (day_of_week / period_number eklenmiş) kayıtlar
  function entriesForAssignment(assignmentId) {
    return scheduleEntries
      .filter((s) => String(s.assignment_id) === String(assignmentId))
      .map((s) => ({
        ...s,
        day_of_week: s.time_slots?.day_of_week,
        period_number: s.time_slots?.period_number,
      }))
  }

  // assignment.id -> computeBlockState sonucu (blok yapısı olan atamalar için)
  const blockStateByAssignment = {}
  assignments.forEach((a) => {
    blockStateByAssignment[a.id] = computeBlockState(a.block_pattern, entriesForAssignment(a.id))
  })

  // Bir schedule kaydının ait olduğu blok (aynı atama + aynı gün + ardışık period) - tekli kayıt da olabilir
  function findRunForEntry(entry) {
    const state = blockStateByAssignment[entry.assignment_id]
    if (!state || !state.hasPattern) return [entry]
    const allRuns = [...state.placedRuns, ...(state.extraRuns || [])]
    const run = allRuns.find((r) => r.some((e) => e.id === entry.id))
    return run || [entry]
  }

  function handleDragStart(e, assignment, blockSize) {
    e.dataTransfer.setData(
      'payload',
      JSON.stringify({ assignmentId: assignment.id, blockSize: blockSize || 1 })
    )
  }

  function handleDragOver(e, cellKey) {
    e.preventDefault()
    setDragOverCell(cellKey)
  }

  function handleDragLeave() {
    setDragOverCell(null)
  }

  async function handleDrop(e, slot) {
    e.preventDefault()
    setDragOverCell(null)

    const raw = e.dataTransfer.getData('payload')
    if (!raw || !slot) return

    let assignmentId, blockSize
    try {
      const parsed = JSON.parse(raw)
      assignmentId = String(parsed.assignmentId)
      blockSize = Number(parsed.blockSize) || 1
    } catch {
      return
    }

    const assignment = assignments.find((a) => String(a.id) === assignmentId)
    if (!assignment) return

    // Bloğun yerleşeceği ardışık slotları belirle (bırakılan hücreden itibaren aynı gün, ileri doğru)
    const targetSlots = []
    for (let p = slot.period_number; p < slot.period_number + blockSize; p++) {
      const s = getSlotFor(slot.day_of_week, p)
      if (!s) {
        toast.warning('Bu günde blok için yeterli ardışık ders saati yok (' + blockSize + ' saat).')
        return
      }
      targetSlots.push(s)
    }

    // Hucrelerden herhangi biri dolu mu?
    const occupied = targetSlots.some((s) => findScheduleEntry(s.id))
    if (occupied) {
      toast.warning('Bu hücrelerden biri dolu. Önce mevcut dersi kaldır.')
      return
    }

    // Haftalık saat limiti kontrolü
    const currentCount = entriesForAssignment(assignmentId).length
    if (currentCount + blockSize > assignment.weekly_hours) {
      toast.warning('Bu ders için haftalık saat limiti (' + assignment.weekly_hours + ' saat) aşılır.')
      return
    }

    // Öğretmen kısıt kontrolü (bloktaki tüm saatler için)
    const teacherId = assignment.teacher_id
    const isBlocked = targetSlots.some((s) =>
      constraints.some((c) => {
        if (String(c.teacher_id) !== String(teacherId)) return false
        if (c.day_of_week !== s.day_of_week) return false
        const cStart = c.start_time.slice(0, 5)
        const cEnd = c.end_time.slice(0, 5)
        const slotStart = s.start_time.slice(0, 5)
        return slotStart >= cStart && slotStart < cEnd
      })
    )

    if (isBlocked) {
      toast.warning('Bu öğretmen bu gün ve saatte(lerde) müsait değil.')
      return
    }

    const rows = targetSlots.map((s) => ({
      branch_id: selectedBranch,
      assignment_id: assignmentId,
      time_slot_id: s.id,
    }))

    // Tek bir INSERT ile toplu ekleme yapılır; DB kısıtlarından biri ihlal edilirse
    // Postgres tüm satırları birlikte geri alır (atomik davranış).
    const { error } = await supabase.from('schedules').insert(rows)

    if (error) {
      if (error.message.includes('unique_teacher_per_slot')) {
        toast.error('Çakışma! Bu öğretmen bu saatte(lerde) başka bir derste.')
      } else if (error.message.includes('unique_branch_per_slot')) {
        toast.error('Çakışma! Bu şube bu saatte(lerde) başka bir derste.')
      } else if (error.message.includes('Haftalık saat limiti')) {
        toast.warning('Haftalık saat limiti doldu.')
      } else if (error.message.includes('müsait değil')) {
        toast.warning('Bu öğretmen bu gün ve saatte müsait değil.')
      } else {
        toast.error('Hata: ' + error.message)
      }
    } else {
      toast.success('Blok yerleştirildi.')
      fetchSchedule(selectedBranch)
    }
  }

  async function handleRemove(entry) {
    const run = findRunForEntry(entry)
    const label = run.length > 1 ? 'Bu ' + run.length + ' saatlik bloğu' : 'Bu dersi'
    const ok = await confirmDialog(label + ' programdan kaldırmak istiyor musun?')
    if (!ok) return

    const ids = run.map((r) => r.id)
    const { error } = await supabase.from('schedules').delete().in('id', ids)
    if (error) toast.error('Hata: ' + error.message)
    else {
      toast.success('Programdan kaldırıldı.')
      fetchSchedule(selectedBranch)
    }
  }

  async function handleAutoGenerate() {
    const ok = await confirmDialog({
      title: 'Programi otomatik olustur',
      message: 'Bu subenin yerlesmemis tum ders bloklari, uygun bos saatlere otomatik dagitilacak. Devam edilsin mi?',
      confirmLabel: 'Olustur',
    })
    if (!ok) return

    // Bu subedeki ogretmenlerin TUM subelerdeki mevcut programini cek (gercek cakisma kontrolu icin)
    const teacherIds = [...new Set(assignments.map((a) => a.teacher_id))]

    const { data: teacherSchedules, error } = await supabase
      .from('schedules')
      .select('time_slot_id, course_assignments!inner(teacher_id)')
      .in('course_assignments.teacher_id', teacherIds)

    if (error) {
      toast.error('Ogretmen programlari alinamadi: ' + error.message)
      return
    }

    const teacherBusyEntries = teacherSchedules.map((s) => ({
      teacher_id: s.course_assignments.teacher_id,
      time_slot_id: s.time_slot_id,
    }))

    const branchExistingEntries = scheduleEntries.map((e) => ({
      assignment_id: e.assignment_id,
      time_slot_id: e.time_slot_id,
    }))

    const { placements, unplaced } = generateAutoSchedule({
      assignments,
      timeSlots,
      branchExistingEntries,
      teacherBusyEntries,
      constraints,
      days: DAYS,
    })

    if (placements.length === 0) {
      toast.warning('Yerlestirilecek bos blok bulunamadi.')
      return
    }

    const rows = placements.map((p) => ({
      branch_id: selectedBranch,
      assignment_id: p.assignment_id,
      time_slot_id: p.time_slot_id,
    }))

    const { error: insertError } = await supabase.from('schedules').insert(rows)

    if (insertError) {
      toast.error('Otomatik yerlestirme sirasinda hata: ' + insertError.message)
    } else if (unplaced.length > 0) {
      toast.warning(placements.length + ' saat yerlesti, ' + unplaced.length + ' blok icin uygun bos saat bulunamadi.')
    } else {
      toast.success('Tum bloklar basariyla yerlestirildi.')
    }

    fetchSchedule(selectedBranch)
  }


  async function handleClearBranch() {
    if (scheduleEntries.length === 0) {
      toast.warning('Bu şubede zaten yerleştirilmiş ders yok.')
      return
    }

    const ok = await confirmDialog({
      title: 'Şubenin programını temizle',
      message: 'Bu şubeye ait ' + scheduleEntries.length + ' ders saati programdan tamamen kaldırılacak. Devam edilsin mi?',
      confirmLabel: 'Temizle',
    })
    if (!ok) return

    const { error } = await supabase.from('schedules').delete().eq('branch_id', selectedBranch)
    if (error) toast.error('Temizlenemedi: ' + error.message)
    else {
      toast.success('Program temizlendi.')
      fetchSchedule(selectedBranch)
    }
  }

  const placedHours = scheduleEntries.length
  const requiredHours = assignments.reduce((sum, assignment) => sum + (assignment.weekly_hours || 0), 0)
  const completion = requiredHours ? Math.round((Math.min(placedHours, requiredHours) / requiredHours) * 100) : 0

  return (
    <div className="page-canvas">
      <div className="page-width schedule-page-width">
        <div className="schedule-context">
          <div><p className="section-kicker">Program dosyası / yerleşim</p><h1>Program oluşturucu</h1><p>Ders bloklarını haftalık gridde yerleştir. Kurallar ve çakışmalar kayıt öncesinde kontrol edilir.</p></div>
          <div className="schedule-context-meta"><span>Yerleşim</span><strong>{fetching ? '—' : `${placedHours}/${requiredHours || 0}`}</strong><small>saat</small></div>
        </div>

        <section className="schedule-toolbar">
          <div>
            <SelectField label="Çalışılan şube" value={selectedBranch} onChange={setSelectedBranch} className="min-w-[210px]" options={branches.map((branch) => ({ value: branch.id, label: branch.name }))} />
            <p className="schedule-toolbar-note"><Info size={13} /> Dolu hücrelerin içinde kaldırma aksiyonu var; yanlışlıkla silme yok.</p>
          </div>
          <div className="schedule-toolbar-actions">
            <button onClick={handleAutoGenerate} disabled={!selectedBranch} className="primary-button"><Wand2 size={15} /> Otomatik oluştur</button>
            <button onClick={handleClearBranch} disabled={!selectedBranch} className="secondary-button"><Trash2 size={15} /> Şubeyi temizle</button>
          </div>
        </section>

        <div className="schedule-layout">
          <aside className="schedule-source">
            <div className="flex items-start justify-between gap-3"><div><h2 className="schedule-panel-title">Ders havuzu</h2><p className="schedule-panel-copy">Kartı sürükleyip tabloya bırak. Bloklar kendi bütünlüğünü korur.</p></div><Info size={16} color="var(--muted)" /></div>
            <div className="assignment-stack">
              {assignments.map((assignment) => {
                const placedCount = entriesForAssignment(assignment.id).length
                const state = blockStateByAssignment[assignment.id]
                if (!state?.hasPattern) {
                  const remaining = assignment.weekly_hours - placedCount
                  return (
                    <div key={assignment.id} draggable={remaining > 0} onDragStart={(event) => handleDragStart(event, assignment, 1)} className={'assignment-card ' + (remaining > 0 ? 'is-ready' : 'is-empty')}>
                      <p className="assignment-card-title">{assignment.courses?.course_name}</p>
                      <p className="assignment-card-teacher">{assignment.teachers?.full_name}</p>
                      <div className="assignment-card-meta"><span>{placedCount}/{assignment.weekly_hours} saat</span><span>{remaining > 0 ? 'sürükle' : 'tamam'}</span></div>
                    </div>
                  )
                }
                return (
                  <div key={assignment.id} className="assignment-card">
                    <p className="assignment-card-title">{assignment.courses?.course_name}</p>
                    <p className="assignment-card-teacher">{assignment.teachers?.full_name}</p>
                    <div className="assignment-card-meta"><span>{placedCount}/{assignment.weekly_hours} saat</span><span>{assignment.block_pattern}</span></div>
                    <div className="assignment-blocks">
                      {state.remainingBlocks.map((size, index) => <div key={'r' + index} draggable onDragStart={(event) => handleDragStart(event, assignment, size)} title={`${size} saatlik blok`} className="block-pill">{size} saat</div>)}
                      {state.placedRuns.map((run, index) => <div key={'p' + index} className="block-pill is-placed">{run.length} saat</div>)}
                    </div>
                  </div>
                )
              })}
              {assignments.length === 0 && <div className="schedule-empty">Bu şube için henüz ders ataması yok.</div>}
            </div>
          </aside>

          <section className="schedule-grid-panel">
            <div className="schedule-grid-head"><div><h2 className="schedule-panel-title">Haftalık yerleşim</h2><p className="schedule-panel-copy">Bir hücreyi doldurmak için ders havuzundan sürükle. Çakışmalar kaydedilmeden önce engellenir.</p></div><div className="schedule-grid-stat">{fetching ? '—' : `${completion}%`}<span>{placedHours} / {requiredHours || 0} saat</span></div></div>
            {fetching ? <div className="h-96 bg-[#f0f3ee] rounded animate-pulse mt-4" /> : (
              <div className="schedule-table-wrap">
                <table className="schedule-table">
                  <thead><tr><th>Saat</th>{DAYS.map((day) => <th key={day.value}>{day.label}</th>)}</tr></thead>
                  <tbody>
                    {Array.from({ length: maxPeriods }, (_, index) => index + 1).map((periodNumber) => (
                      <tr key={periodNumber}>
                        <td><span className="schedule-time">{periodNumber}. ders</span></td>
                        {DAYS.map((day) => {
                          const slot = getSlotFor(day.value, periodNumber)
                          if (!slot) return <td key={day.value} />
                          const entry = findScheduleEntry(slot.id)
                          const cellKey = day.value + '-' + periodNumber
                          const isDragOver = dragOverCell === cellKey
                          return (
                            <td key={day.value} onDragOver={(event) => handleDragOver(event, cellKey)} onDragLeave={handleDragLeave} onDrop={(event) => handleDrop(event, slot)} className={isDragOver ? 'is-over' : ''}>
                              <span className="schedule-time">{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</span>
                              {entry ? (
                                <div className="schedule-cell-entry">
                                  <div><strong>{entry.course_assignments?.courses?.course_name}</strong><small>{entry.course_assignments?.teachers?.full_name}</small></div>
                                  <button type="button" onClick={() => handleRemove(entry)} className="schedule-remove">Kaldır</button>
                                </div>
                              ) : <span className="schedule-cell-empty">+</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
