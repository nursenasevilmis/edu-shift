import { useEffect, useState } from 'react'
import { Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../utils/timeUtils'

export default function ScheduleGrid() {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [assignments, setAssignments] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [scheduleEntries, setScheduleEntries] = useState([])
  const [constraints, setConstraints] = useState([])
  const [dragOverCell, setDragOverCell] = useState(null)
  const [fetching, setFetching] = useState(true)

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
      .select('*, course_assignments(*, courses(course_name), teachers(full_name))')
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

  function handleDragStart(e, assignment) {
    e.dataTransfer.setData('assignmentId', String(assignment.id))
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

    const assignmentId = e.dataTransfer.getData('assignmentId')
    if (!assignmentId || !slot) return

    const existingEntry = findScheduleEntry(slot.id)
    if (existingEntry) {
      alert('Bu hucre dolu. Once mevcut dersi kaldir.')
      return
    }

    const assignment = assignments.find((a) => String(a.id) === assignmentId)
    if (!assignment) return

    const currentCount = scheduleEntries.filter(
      (s) => String(s.assignment_id) === assignmentId
    ).length

    if (currentCount >= assignment.weekly_hours) {
      alert('Bu ders icin haftalik saat limiti (' + assignment.weekly_hours + ' saat) doldu.')
      return
    }

    const teacherId = assignment.teacher_id
    const isBlocked = constraints.some((c) => {
      if (String(c.teacher_id) !== String(teacherId)) return false
      if (c.day_of_week !== slot.day_of_week) return false
      const cStart = c.start_time.slice(0, 5)
      const cEnd = c.end_time.slice(0, 5)
      const slotStart = slot.start_time.slice(0, 5)
      return slotStart >= cStart && slotStart < cEnd
    })

    if (isBlocked) {
      alert('Bu ogretmen bu gun ve saatte musait degil.')
      return
    }

    const { error } = await supabase.from('schedules').insert({
      branch_id: selectedBranch,
      assignment_id: assignmentId,
      time_slot_id: slot.id,
    })

    if (error) {
      if (error.message.includes('unique_teacher_per_slot')) {
        alert('Cakisma! Bu ogretmen bu saatte baska bir derste.')
      } else if (error.message.includes('unique_branch_per_slot')) {
        alert('Cakisma! Bu sube bu saatte baska bir derste.')
      } else if (error.message.includes('Haftalık saat limiti')) {
        alert('Haftalik saat limiti doldu.')
      } else if (error.message.includes('müsait değil')) {
        alert('Bu ogretmen bu gun ve saatte musait degil.')
      } else {
        alert('Hata: ' + error.message)
      }
    } else {
      fetchSchedule(selectedBranch)
    }
  }

  async function handleRemove(entry) {
    if (!confirm('Bu dersi programdan kaldirmak istiyor musun?')) return
    const { error } = await supabase.from('schedules').delete().eq('id', entry.id)
    if (error) alert('Hata: ' + error.message)
    else fetchSchedule(selectedBranch)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Program Olusturucu</h1>
        <p className="text-slate-400 text-sm mt-1">Dersleri surukleyip haftalik tabloya yerlestir</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-4 flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Sube</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="flex gap-4">
        <Card className="p-5 border-0 shadow-soft rounded-2xl w-64 shrink-0 h-fit">
          <h2 className="font-semibold text-sm text-slate-700 mb-1">Dersler ve Ogretmenler</h2>
          <p className="text-xs text-slate-400 mb-4">Karti surukleyip tabloya birak</p>
          <div className="flex flex-col gap-2">
            {assignments.map((a) => {
              const placedCount = scheduleEntries.filter(
                (s) => String(s.assignment_id) === String(a.id)
              ).length
              const remaining = a.weekly_hours - placedCount

              return (
                <div
                  key={a.id}
                  draggable={remaining > 0}
                  onDragStart={(e) => handleDragStart(e, a)}
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
                    {placedCount}/{a.weekly_hours} saat {a.block_pattern ? '(' + a.block_pattern + ')' : ''}
                  </p>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <p className="text-xs text-slate-400">Bu sube icin atama yok.</p>
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