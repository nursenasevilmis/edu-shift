import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

const DAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
]

// Sabit ders saatleri (ileride Zaman Parametreleri ekranından dinamik gelecek)
const PERIODS = [
  { start: '08:30', end: '09:10' },
  { start: '09:20', end: '10:00' },
  { start: '10:10', end: '10:50' },
  { start: '11:00', end: '11:40' },
  { start: '11:50', end: '12:30' },
  { start: '13:15', end: '13:55' },
  { start: '14:05', end: '14:45' },
  { start: '14:55', end: '15:35' },
]

export default function ConstraintCalendar() {
  const [teachers, setTeachers] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    if (selectedTeacher) fetchConstraints(selectedTeacher)
    else setSelectedCells(new Set())
  }, [selectedTeacher])

  async function fetchTeachers() {
    const { data, error } = await supabase.from('teachers').select('*').order('id')
    if (error) console.error('Öğretmenler alınamadı:', error)
    else {
      setTeachers(data)
      if (data.length > 0) setSelectedTeacher(String(data[0].id))
    }
  }

  async function fetchConstraints(teacherId) {
    const { data, error } = await supabase
      .from('teacher_constraints')
      .select('*')
      .eq('teacher_id', teacherId)

    if (error) {
      console.error('Kısıtlar alınamadı:', error)
      return
    }

    // Veritabanındaki kısıtları hücre id'lerine çevir (day-startTime formatında)
    const cells = new Set()
    data.forEach((c) => {
      const start = c.start_time.slice(0, 5) // "08:30:00" -> "08:30"
      cells.add(`${c.day_of_week}-${start}`)
    })
    setSelectedCells(cells)
  }

  function toggleCell(day, period) {
    const key = `${day}-${period.start}`
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

    // Önce bu öğretmenin eski kısıtlarını sil
    const { error: deleteError } = await supabase
      .from('teacher_constraints')
      .delete()
      .eq('teacher_id', selectedTeacher)

    if (deleteError) {
      alert('Hata: ' + deleteError.message)
      setLoading(false)
      return
    }

    // Sonra işaretli hücreleri yeniden ekle
    const rows = Array.from(selectedCells).map((key) => {
      const [day, start] = key.split('-')
      const period = PERIODS.find((p) => p.start === start)
      return {
        teacher_id: selectedTeacher,
        day_of_week: Number(day),
        start_time: period.start,
        end_time: period.end,
        reason: 'Müsait değil',
      }
    })

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('teacher_constraints')
        .insert(rows)

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
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
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
              <th className="p-2 text-left w-24">Saat</th>
              {DAYS.map((d) => (
                <th key={d.value} className="p-2 text-center">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period.start}>
                <td className="p-2 text-gray-500 whitespace-nowrap">
                  {period.start} - {period.end}
                </td>
                {DAYS.map((d) => {
                  const key = `${d.value}-${period.start}`
                  const isBlocked = selectedCells.has(key)
                  return (
                    <td
                      key={d.value}
                      onClick={() => toggleCell(d.value, period)}
                      className={`p-4 text-center border cursor-pointer select-none transition-colors ${
                        isBlocked
                          ? 'bg-red-200 hover:bg-red-300'
                          : 'bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {isBlocked ? 'Müsait Değil' : ''}
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