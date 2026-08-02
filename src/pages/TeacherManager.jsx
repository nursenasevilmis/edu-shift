import { useEffect, useState } from 'react'
import { Card } from '@heroui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'

const DAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
]

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

export default function TeacherManager() {
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

    // 1. Bu kullanıcıya bağlı teacher kaydını bul
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

    // 2. Zaman dilimlerini çek
    const { data: slots } = await supabase.from('time_slots').select('*')
    setTimeSlots(slots || [])

    // 3. Bu öğretmenin programını çek (schedules -> course_assignments üzerinden)
    const { data: entries, error: entriesError } = await supabase
      .from('schedules')
      .select('*, course_assignments!inner(teacher_id, courses(course_name)), branches(name)')
      .eq('course_assignments.teacher_id', teacher.id)

    if (entriesError) console.error('Program alınamadı:', entriesError)
    else setScheduleEntries(entries)

    setLoading(false)
  }

  function findEntry(day, period) {
    const slot = timeSlots.find(
      (ts) => ts.day_of_week === day && ts.start_time.slice(0, 5) === period.start
    )
    if (!slot) return null
    return scheduleEntries.find((e) => e.time_slot_id === slot.id)
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

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
                    const entry = findEntry(d.value, period)
                    return (
                      <td
                        key={d.value}
                        className={`p-2 text-center border h-16 align-middle ${
                          entry ? 'bg-blue-100' : 'bg-gray-50'
                        }`}
                      >
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