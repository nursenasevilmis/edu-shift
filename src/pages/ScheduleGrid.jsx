import { useEffect, useState } from 'react'
import { Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { DAYS, computeBlockState } from '../utils/timeUtils'
import SelectField from '../components/SelectField'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { Wand2 } from 'lucide-react'
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

  async function handleClearSchedule() {
    if (!selectedBranch) return

    if (scheduleEntries.length === 0) {
      toast.warning('Program zaten boş.')
      return
    }

    const ok = await confirmDialog({
      title: 'Programı tamamen temizle',
      message:
        'Bu şubeye ait tüm dersler programdan kaldırılacak. Bu işlem geri alınamaz. Devam etmek istiyor musun?',
      confirmLabel: 'Tümünü Sil',
    })

    if (!ok) return

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('branch_id', selectedBranch)

    if (error) {
      toast.error('Program temizlenirken hata oluştu: ' + error.message)
    } else {
      setScheduleEntries([])
      toast.success('Tüm dersler programdan kaldırıldı.')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Program Oluşturucu</h1>
        <p className="text-slate-400 text-sm mt-1">Dersleri sürükleyip haftalık tabloya yerleştir</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-4 flex items-center justify-between gap-4 flex-wrap">

        <SelectField
          label="Sube"
          value={selectedBranch}
          onChange={setSelectedBranch}
          className="min-w-[180px]"
          options={branches.map((b) => ({
            value: b.id,
            label: b.name
          }))}
        />

        <div className="flex items-center gap-3">

          <button
            onClick={handleAutoGenerate}
            disabled={!selectedBranch}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors duration-150"
          >
            <Wand2 size={16} />
            Otomatik Oluştur
          </button>

          <button
            onClick={handleClearSchedule}
            disabled={!selectedBranch || scheduleEntries.length === 0}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl border border-red-100 transition-colors duration-150"
          >
            Tümünü Temizle
          </button>

        </div>

      </Card>

      <div className="flex gap-4">
        <Card className="p-5 border-0 shadow-soft rounded-2xl w-64 shrink-0 h-fit">
          <h2 className="font-semibold text-sm text-slate-700 mb-1">Dersler ve Öğretmenler</h2>
          <p className="text-xs text-slate-400 mb-4">Kartı sürükleyip tabloya bırak</p>
          <div className="flex flex-col gap-2">
            {assignments.map((a) => {
              const placedCount = entriesForAssignment(a.id).length
              const state = blockStateByAssignment[a.id]

              // Blok yapısı yoksa: eski davranış, tek saatlik kart sürüklenir
              if (!state?.hasPattern) {
                const remaining = a.weekly_hours - placedCount
                return (
                  <div
                    key={a.id}
                    draggable={remaining > 0}
                    onDragStart={(e) => handleDragStart(e, a, 1)}
                    className={
                      'p-3 rounded-xl border transition-all duration-150 ' +
                      (remaining > 0
                        ? 'cursor-grab active:cursor-grabbing bg-blue-50 border-blue-100 hover:shadow-soft hover:-translate-y-0.5'
                        : 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed')
                    }
                  >
                    <p className="font-medium text-sm text-slate-700">{a.courses?.course_name}</p>
                    <p className="text-xs text-slate-500">{a.teachers?.full_name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {placedCount}/{a.weekly_hours} saat
                    </p>
                  </div>
                )
              }

              // Blok yapısı var: her blok parçası (2, 3 gibi) ayrı ayrı sürüklenebilir kart olarak gösterilir
              return (
                <div key={a.id} className="p-3 rounded-xl border bg-indigo-50 border-indigo-100">
                  <p className="font-medium text-sm text-slate-700">{a.courses?.course_name}</p>
                  <p className="text-xs text-slate-500 mb-2">{a.teachers?.full_name}</p>
                  <p className="text-[11px] text-slate-400 mb-2">
                    {placedCount}/{a.weekly_hours} saat &middot; blok: {a.block_pattern}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.remainingBlocks.map((size, idx) => (
                      <div
                        key={'r' + idx}
                        draggable
                        onDragStart={(e) => handleDragStart(e, a, size)}
                        title={size + ' saatlik ardışık blok - sürükle'}
                        className="cursor-grab active:cursor-grabbing px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-150"
                      >
                        {size} saat
                      </div>
                    ))}
                    {state.placedRuns.map((run, idx) => (
                      <div
                        key={'p' + idx}
                        title="Yerleştirildi"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700"
                      >
                        ✓ {run.length} saat
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <p className="text-xs text-slate-400">Bu şube için atama yok.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-soft rounded-2xl flex-1 overflow-x-auto">
          {fetching ? (
            <div className="h-96 bg-slate-50 rounded-xl animate-pulse"></div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left w-32 text-xs font-medium text-slate-400">Saat</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="p-2 text-center text-xs font-medium text-slate-500">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((periodNumber) => (
                  <tr key={periodNumber}>
                    <td className="p-2 text-slate-400 whitespace-nowrap text-xs">{periodNumber}. Ders</td>
                    {DAYS.map((d) => {
                      const slot = getSlotFor(d.value, periodNumber)
                      if (!slot) {
                        return <td key={d.value} className="p-2 border border-slate-50 bg-slate-50 rounded-lg"></td>
                      }
                      const entry = findScheduleEntry(slot.id)
                      const cellKey = d.value + '-' + periodNumber
                      const isDragOver = dragOverCell === cellKey

                      return (
                        <td
                          key={d.value}
                          onDragOver={(e) => handleDragOver(e, cellKey)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, slot)}
                          onClick={() => entry && handleRemove(entry)}
                          className={
                            'p-2 text-center h-16 align-middle rounded-lg border transition-all duration-150 ' +
                            (entry
                              ? 'bg-blue-50 border-blue-100 hover:bg-blue-100 cursor-pointer'
                              : isDragOver
                                ? 'bg-emerald-50 border-emerald-300 border-2'
                                : 'bg-slate-50 border-slate-100')
                          }
                        >
                          <p className="text-[10px] text-slate-400 mb-1">
                            {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                          </p>
                          {entry && (
                            <div>
                              <p className="font-medium text-xs text-slate-700">{entry.course_assignments?.courses?.course_name}</p>
                              <p className="text-[11px] text-slate-500">{entry.course_assignments?.teachers?.full_name}</p>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}