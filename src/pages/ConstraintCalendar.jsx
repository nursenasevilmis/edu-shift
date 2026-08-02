import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../utils/timeUtils'

export default function ConstraintCalendar() {
  const [teachers, setTeachers] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
    fetchTimeSlots()
  }, [])

  useEffect(() => {
    if (selectedTeacher) fetchConstraints(selectedTeacher)
    else setSelectedCells(new Set())
  }, [selectedTeacher])

  async function fetchTeachers() {
    const { data, error } = await supabase.from('teachers').select('*').order('id')
    if (error) console.error(error)
    else {
      setTeachers(data)
      if (data.length > 0) setSelectedTeacher(String(data[0].id))
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

  async function fetchConstraints(teacherId) {
    const { data, error } = await supabase
      .from('teacher_constraints')
      .select('*')
      .eq('teacher_id', teacherId)

    if (error) {
      console.error(error)
      return
    }

    const cells = new Set()
    data.forEach((c) => {
      cells.add(`${c.day_of_week}-${c.start_time.slice(0, 5)}`)
    })
    setSelectedCells(cells)
  }

  const maxPeriods = Math.max(
    1,
    ...DAYS.map((d) => timeSlots.filter((s) => s.day_of_week === d.value).length)
  )

  function getSlotFor(day, periodNumber) {
    return timeSlots.find((s) => s.day_of_week === day && s.period_number === periodNumber)
  }

  function toggleCell(slot) {
    const key = `${slot.day_of_week}-${slot.start_time.slice(0, 5)}`
    setSelectedCells((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSave() {
    if (!selectedTeacher) return
    setLoading(true)

    const { error: deleteError } = await supabase
      .from('teacher_constraints')
      .delete()
      .eq('teacher_id', selectedTeacher)

    if (deleteError) {
      alert('Hata: ' + deleteError.message)
      setLoading(false)
      return
    }

    const rows = Array.from(selectedCells).map((key) => {
      const [day, start] = key.split('-')
      const slot = timeSlots.find(
        (s) => s.day_of_week === Number(day) && s.start_time.slice(0, 5) === start
      )
      return {
        teacher_id: selectedTeacher,
        day_of_week: Number(day),
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: 'Müsait değil',
      }
    })

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('teacher_constraints').insert(rows)
      if (insertError) {
        alert('Hata: ' + insertError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    alert('Kısıtlar kaydedildi.')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Öğretmen Kısıt Takvimi</h1>

      <Card className="p-4 mb-4 flex flex-row items-center gap-4">
        <label className="text-sm font-medium">Öğretmen:</label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
        <div className="flex items-center gap-4 ml-auto text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 inline-block rounded"></span> Müsait
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-200 inline-block rounded"></span> Müsait Değil
          </span>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
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
                <td className="p-2 text-gray-500 whitespace-nowrap">{periodNumber}. Ders</td>
                {DAYS.map((d) => {
                  const slot = getSlotFor(d.value, periodNumber)
                  if (!slot) {
                    return <td key={d.value} className="p-2 border bg-gray-100"></td>
                  }
                  const key = `${d.value}-${slot.start_time.slice(0, 5)}`
                  const isBlocked = selectedCells.has(key)
                  return (
                    <td
                      key={d.value}
                      onClick={() => toggleCell(slot)}
                      className={`p-3 text-center border cursor-pointer select-none transition-colors ${
                        isBlocked ? 'bg-red-200 hover:bg-red-300' : 'bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      <p className="text-[10px] text-gray-500">
                        {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                      </p>
                      {isBlocked && <span className="text-xs">Müsait Değil</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-end mt-4">
        <Button color="primary" onClick={handleSave} isLoading={loading}>
          Kaydet
        </Button>
      </div>
    </div>
  )
}