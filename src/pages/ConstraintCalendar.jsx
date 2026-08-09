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
  const [fetching, setFetching] = useState(true)

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
      cells.add(c.day_of_week + '-' + c.start_time.slice(0, 5))
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
    const key = slot.day_of_week + '-' + slot.start_time.slice(0, 5)
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
      const parts = key.split('-')
      const day = parts[0]
      const start = parts[1]
      const slot = timeSlots.find(
        (s) => s.day_of_week === Number(day) && s.start_time.slice(0, 5) === start
      )
      return {
        teacher_id: selectedTeacher,
        day_of_week: Number(day),
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: 'Musait degil',
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
    alert('Kisitlar kaydedildi.')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ogretmen Kisit Takvimi</h1>
        <p className="text-slate-400 text-sm mt-1">Ogretmenin musait olmadigi saatleri isaretle</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-4 flex flex-row items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Ogretmen</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-100 border border-emerald-200 inline-block rounded"></span> Musait
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-100 border border-rose-200 inline-block rounded"></span> Musait Degil
          </span>
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-soft rounded-2xl overflow-x-auto">
        {fetching ? (
          <div className="h-64 bg-slate-50 rounded-xl animate-pulse"></div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left w-28 text-xs font-medium text-slate-400">Saat</th>
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
                    const key = d.value + '-' + slot.start_time.slice(0, 5)
                    const isBlocked = selectedCells.has(key)
                    return (
                      <td
                        key={d.value}
                        onClick={() => toggleCell(slot)}
                        className={
                          'p-3 text-center cursor-pointer select-none transition-all duration-150 rounded-lg border ' +
                          (isBlocked
                            ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100')
                        }
                      >
                        <p className="text-[10px] text-slate-400">
                          {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        </p>
                        {isBlocked && <span className="text-[10px] text-rose-500 font-medium">Musait Degil</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex justify-end mt-4">
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={loading}
          className="rounded-xl font-medium"
        >
          Kaydet
        </Button>
      </div>
    </div>
  )
}