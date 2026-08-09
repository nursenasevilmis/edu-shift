import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [branches, setBranches] = useState([])

  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('')
  const [blockPattern, setBlockPattern] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setFetching(true)
    const results = await Promise.all([
      supabase
        .from('course_assignments')
        .select('*, courses(course_name), teachers(full_name), branches(name)')
        .order('id'),
      supabase.from('courses').select('*').order('id'),
      supabase.from('teachers').select('*').order('id'),
      supabase.from('branches').select('*').order('id'),
    ])

    const a = results[0]
    const c = results[1]
    const t = results[2]
    const b = results[3]

    if (a.error) console.error('Atamalar alinamadi:', a.error)
    else setAssignments(a.data)

    setCourses(c.data || [])
    setTeachers(t.data || [])
    setBranches(b.data || [])
    setFetching(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!courseId || !teacherId || !branchId || !weeklyHours) {
      alert('Lutfen tum alanlari doldur.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('course_assignments').insert({
      course_id: courseId,
      teacher_id: teacherId,
      branch_id: branchId,
      weekly_hours: Number(weeklyHours),
      block_pattern: blockPattern || null,
    })

    setLoading(false)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setCourseId('')
      setTeacherId('')
      setBranchId('')
      setWeeklyHours('')
      setBlockPattern('')
      fetchAll()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu atamayi silmek istedigine emin misin?')) return
    const { error } = await supabase.from('course_assignments').delete().eq('id', id)
    if (error) alert('Hata: ' + error.message)
    else fetchAll()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ders Atamalari</h1>
        <p className="text-slate-400 text-sm mt-1">
          Hangi ogretmenin hangi dersi hangi subede okutacagini tanimla
        </p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ders</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Ders Sec --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ogretmen</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Ogretmen Sec --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Sube</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[130px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Sube Sec --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Haftalik Saat</label>
            <Input
              type="number"
              placeholder="orn: 5"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              className="w-28"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Blok Yapisi</label>
            <Input
              placeholder="orn: 2+3"
              value={blockPattern}
              onChange={(e) => setBlockPattern(e.target.value)}
              className="w-32"
            />
          </div>

          <Button
            color="primary"
            type="submit"
            isLoading={loading}
            className="rounded-xl font-medium"
          >
            Ekle
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {fetching && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {!fetching && assignments.map((a) => (
          <Card
            key={a.id}
            className="p-4 border-0 shadow-soft shadow-soft-hover rounded-xl flex flex-row justify-between items-center transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm">
                📋
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">
                  {a.courses?.course_name}
                  <span className="text-slate-300 mx-1.5">•</span>
                  <span className="text-slate-500 font-normal">{a.teachers?.full_name}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {a.branches?.name} — {a.weekly_hours} saat{a.block_pattern ? ', ' + a.block_pattern : ''}
                </p>
              </div>
            </div>
            <Button
              color="danger"
              variant="light"
              size="sm"
              className="rounded-lg"
              onClick={() => handleDelete(a.id)}
            >
              Sil
            </Button>
          </Card>
        ))}

        {!fetching && assignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz atama yapilmadi</p>
          </div>
        )}
      </div>
    </div>
  )
}