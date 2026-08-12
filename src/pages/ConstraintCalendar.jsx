import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../utils/timeUtils'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useToast } from '../contexts/ToastContext'

export default function ConstraintCalendar() {
  const [teachers, setTeachers] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()

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
    const { data, error } = await supabase.from('time_slots').select('*').order('day_of_week').order('period_number')
    if (error) console.error(error)
    else setTimeSlots(data)
    setFetching(false)
  }

  async function fetchConstraints(teacherId) {
    const { data, error } = await supabase.from('teacher_constraints').select('*').eq('teacher_id', teacherId)
    if (error) {
      console.error(error)
      return
    }
    const cells = new Set()
    data.forEach((c) => cells.add(c.day_of_week + '|' + c.start_time.slice(0, 5)))
    setSelectedCells(cells)
  }

  const maxPeriods = Math.max(1, ...DAYS.map((d) => timeSlots.filter((s) => s.day_of_week === d.value).length))

  function getSlotFor(day, periodNumber) {
    return timeSlots.find((s) => s.day_of_week === day && s.period_number === periodNumber)
  }

  function toggleCell(slot) {
    const key = slot.day_of_week + '|' + slot.start_time.slice(0, 5)
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

    const { error: deleteError } = await supabase.from('teacher_constraints').delete().eq('teacher_id', selectedTeacher)
    if (deleteError) {
      toast.error('Hata: ' + deleteError.message)
      setLoading(false)
      return
    }

    const rows = Array.from(selectedCells).map((key) => {
      const parts = key.split('|')
      const day = parts[0]
      const start = parts[1]
      const slot = timeSlots.find((s) => s.day_of_week === Number(day) && s.start_time.slice(0, 5) === start)
      return { teacher_id: selectedTeacher, day_of_week: Number(day), start_time: slot.start_time, end_time: slot.end_time, reason: 'Müsait değil' }
    })

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('teacher_constraints').insert(rows)
      if (insertError) {
        toast.error('Hata: ' + insertError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    toast.success('Kısıtlar kaydedildi.')
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Öğretmen Kısıt Takvimi" subtitle="Öğretmenin müsait olmadığı saatleri işaretle" />

      <PageCard
        title="Öğretmen Müsaitlik Alanı"
        description="Müsait olmayan periyotları seçmek için hücrelere tıkla. Grid, derslerin bu saatlere yerleşmesini engeller."
        action={
          <SelectField
            value={selectedTeacher}
            onChange={setSelectedTeacher}
            className="min-w-[200px]"
            options={teachers.map((t) => ({ value: t.id, label: t.full_name }))}
          />
        }
      >
        {fetching ? (
          <div className="h-64 bg-slate-50 rounded-xl animate-pulse"></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="pb-3 text-left w-20 text-xs font-medium text-slate-400">Periyot</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="pb-3 text-center text-xs font-medium text-slate-500">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((periodNumber) => {
                  const firstSlotOfRow = getSlotFor(1, periodNumber) || getSlotFor(2, periodNumber)
                  return (
                    <tr key={periodNumber}>
                      <td className="py-1.5 pr-2">
                        <div className="w-11 h-11 rounded-full bg-slate-50 flex flex-col items-center justify-center text-slate-500">
                          <span className="text-xs font-semibold leading-none">{periodNumber}</span>
                          <span className="text-[9px] leading-none mt-0.5">{firstSlotOfRow ? firstSlotOfRow.start_time.slice(0, 5) : ''}</span>
                        </div>
                      </td>
                      {DAYS.map((d) => {
                        const slot = getSlotFor(d.value, periodNumber)
                        if (!slot) return <td key={d.value} className="p-1.5"></td>
                        const key = d.value + '|' + slot.start_time.slice(0, 5)
                        const isBlocked = selectedCells.has(key)
                        return (
                          <td key={d.value} className="p-1.5">
                            <button
                              onClick={() => toggleCell(slot)}
                              className={
                                'w-full h-11 rounded-xl border text-xs font-medium transition-colors duration-150 ' +
                                (isBlocked
                                  ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50')
                              }
                            >
                              {isBlocked ? 'Müsait Değil' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors duration-150"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </PageCard>
    </div>
  )
}