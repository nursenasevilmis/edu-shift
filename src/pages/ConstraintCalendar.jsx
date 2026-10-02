import { useCallback, useEffect, useState } from 'react'
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
  const [leaveDays, setLeaveDays] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()

  const fetchTeachers = useCallback(async () => {
    const { data, error } = await supabase.from('teachers').select('*').order('id')
    if (error) console.error(error)
    else {
      setTeachers(data || [])
      if (data?.length > 0) setSelectedTeacher(String(data[0].id))
    }
  }, [])

  const fetchTimeSlots = useCallback(async () => {
    setFetching(true)
    const { data, error } = await supabase.from('time_slots').select('*').order('day_of_week').order('period_number')
    if (error) console.error(error)
    else setTimeSlots(data || [])
    setFetching(false)
  }, [])

  const fetchConstraints = useCallback(async (teacherId) => {
    const { data, error } = await supabase.from('teacher_constraints').select('*').eq('teacher_id', teacherId)
    if (error) {
      console.error(error)
      return
    }
    const cells = new Set()
    const days = new Set()
    ;(data || []).forEach((constraint) => {
      if (constraint.start_time?.slice(0, 5) === '00:00' && constraint.end_time?.slice(0, 5) === '23:59') days.add(Number(constraint.day_of_week))
      else cells.add(constraint.day_of_week + '|' + constraint.start_time.slice(0, 5))
    })
    setSelectedCells(cells)
    setLeaveDays(days)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([fetchTeachers(), fetchTimeSlots()]))
  }, [fetchTeachers, fetchTimeSlots])

  useEffect(() => {
    if (selectedTeacher) void Promise.resolve().then(() => fetchConstraints(selectedTeacher))
  }, [selectedTeacher, fetchConstraints])

  const maxPeriods = Math.max(1, ...DAYS.map((day) => timeSlots.filter((slot) => slot.day_of_week === day.value).length))

  function getSlotFor(day, periodNumber) {
    return timeSlots.find((slot) => slot.day_of_week === day && slot.period_number === periodNumber)
  }

  function toggleCell(slot) {
    const key = slot.day_of_week + '|' + slot.start_time.slice(0, 5)
    setSelectedCells((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleLeaveDay(day) {
    setLeaveDays((previous) => {
      const next = new Set(previous)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  async function handleSave() {
    if (!selectedTeacher) return
    setLoading(true)
    const { error: deleteError } = await supabase.from('teacher_constraints').delete().eq('teacher_id', selectedTeacher)
    if (deleteError) {
      toast.error('Uygunluk kaydedilemedi: ' + deleteError.message)
      setLoading(false)
      return
    }

    const rows = Array.from(selectedCells).map((key) => {
      const [day, start] = key.split('|')
      const slot = timeSlots.find((item) => item.day_of_week === Number(day) && item.start_time.slice(0, 5) === start)
      return { teacher_id: selectedTeacher, day_of_week: Number(day), start_time: slot.start_time, end_time: slot.end_time, reason: 'Saat uygun değil' }
    })
    leaveDays.forEach((day) => rows.push({ teacher_id: selectedTeacher, day_of_week: day, start_time: '00:00:00', end_time: '23:59:00', reason: 'İzin günü' }))

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('teacher_constraints').insert(rows)
      if (insertError) {
        toast.error('Uygunluk kaydedilemedi: ' + insertError.message)
        setLoading(false)
        return
      }
    }
    setLoading(false)
    toast.success('Öğretmen uygunluğu kaydedildi.')
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Öğretmen uygunluğu" subtitle="İzin günlerini ve haftalık uygun olmayan saatleri tanımla" />
      <PageCard
        title="İzin günleri ve uygun olmayan saatler"
        description="Önce tam gün izinleri seç, ardından yalnızca belirli saatlerde uygun olmayan periyotları işaretle."
        action={<SelectField value={selectedTeacher} onChange={setSelectedTeacher} className="min-w-[200px]" options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.full_name }))} />}
      >
        {!fetching && (
          <div className="mb-6 border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Haftalık izin günleri</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DAYS.map((day) => (
                <button type="button" key={day.value} onClick={() => toggleLeaveDay(day.value)} className={'border px-3 py-3 text-sm font-semibold rounded transition-colors ' + (leaveDays.has(day.value) ? 'bg-[#121a2a] border-[#121a2a] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#121a2a]')}>
                  <span className="block">{day.label}</span>
                  <span className="text-[11px] font-normal opacity-70">{leaveDays.has(day.value) ? 'İzin günü' : 'Çalışıyor'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {fetching ? <div className="h-64 bg-slate-50 rounded animate-pulse" /> : (
          <div className="overflow-x-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Saat bazlı uygun olmayan periyotlar</p>
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className="pb-3 text-left w-20 text-xs font-medium text-slate-400">Periyot</th>{DAYS.map((day) => <th key={day.value} className="pb-3 text-center text-xs font-medium text-slate-500">{day.label}</th>)}</tr></thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, index) => index + 1).map((periodNumber) => {
                  const firstSlot = getSlotFor(1, periodNumber) || getSlotFor(2, periodNumber)
                  return <tr key={periodNumber}>
                    <td className="py-1.5 pr-2"><div className="w-11 h-11 rounded bg-slate-50 flex flex-col items-center justify-center text-slate-500"><span className="text-xs font-semibold">{periodNumber}</span><span className="text-[9px] mt-0.5">{firstSlot ? firstSlot.start_time.slice(0, 5) : ''}</span></div></td>
                    {DAYS.map((day) => {
                      const slot = getSlotFor(day.value, periodNumber)
                      if (!slot) return <td key={day.value} className="p-1.5" />
                      const key = day.value + '|' + slot.start_time.slice(0, 5)
                      const isBlocked = selectedCells.has(key) || leaveDays.has(day.value)
                      return <td key={day.value} className="p-1.5"><button type="button" disabled={leaveDays.has(day.value)} onClick={() => toggleCell(slot)} className={'w-full h-11 rounded border text-xs font-medium transition-colors ' + (leaveDays.has(day.value) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : isBlocked ? 'bg-[#e9f7ba] border-[#c9f36b] text-[#24340a] hover:bg-[#dff49a]' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50')}>{leaveDays.has(day.value) ? 'İzin günü' : isBlocked ? 'Uygun değil' : 'Uygun'}</button></td>
                    })}
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-6"><button type="button" onClick={handleSave} disabled={loading || !selectedTeacher} className="primary-button">{loading ? 'Kaydediliyor...' : 'Uygunluğu kaydet'}</button></div>
      </PageCard>
    </div>
  )
}
