import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

export default function CourseManager() {
  const [courses, setCourses] = useState([])
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('id')

    if (error) console.error('Dersler alınamadı:', error)
    else setCourses(data)
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
    if (!confirm('Bu dersi silmek istediğine emin misin?')) return

    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) alert('Hata: ' + error.message)
    else fetchCourses()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Ders Yönetimi</h1>

      <Card className="p-4 mb-6">
        <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
          <Input
            label="Ders Adı (örn: Matematik)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <Input
            label="Ders Kodu (örn: MAT101)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
          <Button color="primary" type="submit" isLoading={loading}>
            Ekle
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {courses.map((c) => (
          <Card key={c.id} className="p-3 flex flex-row justify-between items-center">
            <span>{c.course_name} ({c.course_code})</span>
            <Button color="danger" size="sm" onClick={() => handleDelete(c.id)}>
              Sil
            </Button>
          </Card>
        ))}
        {courses.length === 0 && (
          <p className="text-gray-500 text-center">Henüz ders eklenmedi.</p>
        )}
      </div>
    </div>
  )
}