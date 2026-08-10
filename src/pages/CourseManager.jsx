import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

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
    const { error } = await supabase.from('courses').insert({ course_name: courseName, course_code: courseCode })
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

  const dotColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500']

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Dersler" subtitle="Okulda okutulan tum dersleri buradan yonet" />

      <PageCard title="Dersler" description="Ogretmen ve blok atamalari Ders Atamalari sayfasindan yapilir">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            placeholder="KOD (orn: MAT101)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Ders adi (orn: Matematik)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors duration-150 shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ekle
          </button>
        </form>

        {fetching ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-[11px] tracking-wider font-semibold text-slate-400">DERS</th>
                <th className="text-right pb-3 text-[11px] tracking-wider font-semibold text-slate-400">ISLEM</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={'w-2 h-2 rounded-full shrink-0 ' + dotColors[i % dotColors.length]}></span>
                      <div>
                        <p className="font-medium text-slate-700">{c.course_name}</p>
                        <p className="text-xs text-slate-400">{c.course_code || 'Kod girilmedi'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors duration-150">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!fetching && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz ders eklenmedi</p>
          </div>
        )}
      </PageCard>
    </div>
  )
}