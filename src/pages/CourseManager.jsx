import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

export default function CourseManager() {
  const [courses, setCourses] = useState([])
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    setFetching(true)
    const { data, error } = await supabase.from('courses').select('*').order('id')
    if (error) console.error('Dersler alinamadi:', error)
    else setCourses(data)
    setFetching(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!courseName.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('courses')
      .insert({ course_name: courseName, course_code: courseCode })
    setLoading(false)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setCourseName('')
      setCourseCode('')
      fetchCourses()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu dersi silmek istedigine emin misin?')) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) alert('Hata: ' + error.message)
    else fetchCourses()
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ders Yonetimi</h1>
        <p className="text-slate-400 text-sm mt-1">Okulda okutulan tum dersleri buradan yonet</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ders Adi</label>
            <Input
              placeholder="orn: Matematik"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ders Kodu</label>
            <Input
              placeholder="orn: MAT101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="max-w-[160px]"
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
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {!fetching && courses.map((c) => (
          <Card
            key={c.id}
            className="p-4 border-0 shadow-soft shadow-soft-hover rounded-xl flex flex-row justify-between items-center transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm">
                📘
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">{c.course_name}</p>
                <p className="text-xs text-slate-400">
                  {c.course_code || 'Kod girilmedi'}
                </p>
              </div>
            </div>
            <Button
              color="danger"
              variant="light"
              size="sm"
              className="rounded-lg"
              onClick={() => handleDelete(c.id)}
            >
              Sil
            </Button>
          </Card>
        ))}

        {!fetching && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz ders eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  )
}