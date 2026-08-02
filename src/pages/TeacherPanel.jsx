import { useEffect, useState } from 'react'
import { Card } from '@heroui/react'
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
      console.error('Öğretmen kaydı bulunamadı:', teacherError)
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

    if (entriesError) console.error('Program alınamadı:', entriesError)
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

  if (loading) return <div className="p-6">Yükleniyor...</div>

  if (!teacherRecord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">
          Hesabına bağlı bir öğretmen kaydı bulunamadı. Yöneticinle iletişime geç.
        </p>
        <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded">
          Çıkış Yap
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-between items-center p-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-bold">Programım</h1>
          <p className="text-sm text-gray-500">
            {teacherRecord.full_name} {teacherRecord.branches?.name && `— ${teacherRecord.branches.name}`}
          </p>
        </div>
        <button onClick={signOut} className="px-3 py-1 bg-red-500 text-white rounded">
          Çıkış Yap
        </button>
      </div>

      <div className="p-6">
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
                    if (!slot) return <td key={d.value} className="p-2 border bg-gray-100"></td>

                    const entry = findEntry(slot.id)
                    return (
                      <td
                        key={d.value}
                        className={`p-2 text-center border h-16 align-middle ${entry ? 'bg-blue-100' : 'bg-gray-50'
                          }`}
                      >
                        <p className="text-[10px] text-gray-400 mb-1">
                          {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        </p>
                        {entry && (
                          <div>
                            <p className="font-medium text-xs">
                              {entry.course_assignments?.courses?.course_name}
                            </p>
                            <p className="text-xs text-gray-500">{entry.branches?.name}</p>
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