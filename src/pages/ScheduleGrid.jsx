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
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('day_of_week')
      .order('period_number')
    if (error) console.error(error)
    else setTimeSlots(data)
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

  // Bir günün en fazla kaç period'u varsa, tabloyu o kadar satır göstereceğiz
  const maxPeriods = Math.max(
    1,
    ...DAYS.map(
      (d) => timeSlots.filter((s) => s.day_of_week === d.value).length
    )
  )

  function getSlotFor(day, periodNumber) {
    return timeSlots.find(
      (s) => s.day_of_week === day && s.period_number === periodNumber
    )
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
      alert('Bu hücre dolu. Önce mevcut dersi kaldır.')
      return
    }

    const assignment = assignments.find((a) => String(a.id) === assignmentId)
    if (!assignment) return

    const currentCount = scheduleEntries.filter(
      (s) => String(s.assignment_id) === assignmentId
    ).length

    if (currentCount >= assignment.weekly_hours) {
      alert(`Bu ders için haftalık saat limiti (${assignment.weekly_hours} saat) doldu.`)
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
      alert('Bu öğretmen bu gün ve saatte müsait değil (kısıt takviminde işaretli).')
      return
    }

    const { error } = await supabase.from('schedules').insert({
      branch_id: selectedBranch,
      assignment_id: assignmentId,
      time_slot_id: slot.id,
    })

    if (error) {
      if (error.message.includes('unique_teacher_per_slot')) {
        alert('Çakışma! Bu öğretmen bu saatte başka bir derste.')
      } else if (error.message.includes('unique_branch_per_slot')) {
        alert('Çakışma! Bu şube bu saatte başka bir derste.')
      } else if (error.message.includes('Haftalık saat limiti')) {
        alert('Haftalık saat limiti doldu.')
      } else if (error.message.includes('müsait değil')) {
        alert('Bu öğretmen bu gün ve saatte müsait değil.')
      } else {
        alert('Hata: ' + error.message)
      }
    } else {
      fetchSchedule(selectedBranch)
    }
  }

  async function handleRemove(entry) {
    if (!confirm('Bu dersi programdan kaldırmak istiyor musun?')) return
    const { error } = await supabase.from('schedules').delete().eq('id', entry.id)
    if (error) alert('Hata: ' + error.message)
    else fetchSchedule(selectedBranch)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Program Oluşturucu</h1>

      <Card className="p-4 mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">Şube:</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </Card>

      <div className="flex gap-4">
        <Card className="p-4 w-64 shrink-0">
          <h2 className="font-semibold mb-2 text-sm text-gray-600">Dersler ve Öğretmenler</h2>
          <p className="text-xs text-gray-400 mb-3">Kartı sürükleyip tabloya bırak.</p>
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
                  className={`p-2 rounded-lg border-2 border-transparent transition-colors ${
                    remaining > 0
                      ? 'cursor-grab active:cursor-grabbing bg-gray-100 hover:bg-gray-200'
                      : 'bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <p className="font-medium text-sm">{a.courses?.course_name}</p>
                  <p className="text-xs text-gray-500">{a.teachers?.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {placedCount}/{a.weekly_hours} saat yerleşti {a.block_pattern && `(${a.block_pattern})`}
                  </p>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <p className="text-xs text-gray-400">Bu şube için atama yok.</p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left w-32">Saat</th>
                {DAYS.map((d) => (
                  <th key={d.value} className="p-2 text-center">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((periodNumber) => (
                <tr key={periodNumber}>
                  <td className="p-2 text-gray-500 whitespace-nowrap">
                    {periodNumber}. Ders
                  </td>
                  {DAYS.map((d) => {
                    const slot = getSlotFor(d.value, periodNumber)
                    if (!slot) {
                      return <td key={d.value} className="p-2 border bg-gray-100"></td>
                    }
                    const entry = findScheduleEntry(slot.id)
                    const cellKey = `${d.value}-${periodNumber}`
                    const isDragOver = dragOverCell === cellKey

                    return (
                      <td
                        key={d.value}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, slot)}
                        onClick={() => entry && handleRemove(entry)}
                        className={`p-2 text-center border h-16 align-middle transition-colors ${
                          entry
                            ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
                            : isDragOver
                            ? 'bg-green-100 border-green-400 border-2'
                            : 'bg-gray-50'
                        }`}
                      >
                        <p className="text-[10px] text-gray-400 mb-1">
                          {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        </p>
                        {entry && (
                          <div>
                            <p className="font-medium text-xs">{entry.course_assignments?.courses?.course_name}</p>
                            <p className="text-xs text-gray-500">{entry.course_assignments?.teachers?.full_name}</p>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}