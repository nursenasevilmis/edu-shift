import { useEffect, useState } from 'react'
import { Card, Button } from '@heroui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import { DAYS } from '../utils/timeUtils'

export default function TeacherPanel() {
  const { profile, signOut, user } = useAuth()
  const [teacherRecord, setTeacherRecord] = useState(null)
  const [scheduleEntries, setScheduleEntries] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchTeacherAndSchedule()
  }, [user])

  async function fetchTeacherAndSchedule() {
    setLoading(true)

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*, branches(name)')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      console.error('Ogretmen kaydi bulunamadi:', teacherError)
      setLoading(false)
      return
    }

    setTeacherRecord(teacher)

    const { data: slots } = await supabase
      .from('time_slots')
      .select('*')
      .order('day_of_week')
      .order('period_number')
    setTimeSlots(slots || [])

    const { data: entries, error: entriesError } = await supabase
      .from('schedules')
      .select('*, course_assignments!inner(teacher_id, courses(course_name)), branches(name)')
      .eq('course_assignments.teacher_id', teacher.id)

    if (entriesError) console.error('Program alinamadi:', entriesError)
    else setScheduleEntries(entries)

    setLoading(false)
  }

  const maxPeriods = Math.max(
    1,
    ...DAYS.map((d) => timeSlots.filter((s) => s.day_of_week === d.value).length)
  )

  function getSlotFor(day, periodNumber) {
    return timeSlots.find((s) => s.day_of_week === day && s.period_number === periodNumber)
  }

  function findEntry(slotId) {
    return scheduleEntries.find((e) => e.time_slot_id === slotId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse mb-6"></div>
          <div className="h-96 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!teacherRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8">
        <Card className="p-8 border-0 shadow-soft rounded-2xl max-w-md text-center">
          <p className="text-slate-600 mb-4">
            Hesabina bagli bir ogretmen kaydi bulunamadi. Yoneticinle iletisime gec.
          </p>
          <Button color="danger" variant="light" onClick={signOut} className="rounded-xl">
            Cikis Yap
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex justify-between items-center p-6 bg-white border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Programim</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {teacherRecord.full_name} {teacherRecord.branches?.name && '— ' + teacherRecord.branches.name}
          </p>
        </div>
        <Button
          color="danger"
          variant="light"
          size="sm"
          onClick={signOut}
          className="rounded-xl"
        >
          Cikis Yap
        </Button>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        <Card className="p-5 border-0 shadow-soft rounded-2xl overflow-x-auto">
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
                    if (!slot) return <td key={d.value} className="p-2 border border-slate-50 bg-slate-50 rounded-lg"></td>

                    const entry = findEntry(slot.id)
                    return (
                      <td
                        key={d.value}
                        className={
                          'p-2 text-center h-16 align-middle rounded-lg border ' +
                          (entry ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100')
                        }
                      >
                        <p className="text-[10px] text-slate-400 mb-1">
                          {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        </p>
                        {entry && (
                          <div>
                            <p className="font-medium text-xs text-slate-700">
                              {entry.course_assignments?.courses?.course_name}
                            </p>
                            <p className="text-[11px] text-slate-500">{entry.branches?.name}</p>
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