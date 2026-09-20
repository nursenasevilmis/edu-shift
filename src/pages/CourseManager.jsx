import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from '../components/UiMarks'
import { supabase } from '../supabaseClient'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

export default function CourseManager() {
  const [courses, setCourses] = useState([])
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    setFetching(true)
    const { data, error } = await supabase.from('courses').select('*').order('id')
    if (error) console.error('Dersler alınamadı:', error)
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
      toast.error('Ders eklenemedi: ' + error.message)
    } else {
      toast.success('Ders eklendi.')
      setCourseName('')
      setCourseCode('')
      fetchCourses()
    }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditName(c.course_name)
    setEditCode(c.course_code || '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id) {
    if (!editName.trim()) {
      toast.warning('Ders adı boş olamaz.')
      return
    }
    const { error } = await supabase
      .from('courses')
      .update({ course_name: editName, course_code: editCode })
      .eq('id', id)

    if (error) {
      toast.error('Güncellenemedi: ' + error.message)
    } else {
      toast.success('Ders güncellendi.')
      setEditingId(null)
      fetchCourses()
    }
  }

  async function handleDelete(id) {
    const { count } = await supabase
      .from('course_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', id)

    const assignmentCount = count || 0
    let message = 'Bu dersi silmek istediğine emin misin? Bu işlem geri alınamaz.'
    if (assignmentCount > 0) {
      message = 'Bu ders ' + assignmentCount + ' atamada kullanılıyor. Silersen o atamalar da (ve varsa programa yerleştirilmiş saatleri) birlikte silinecek. Devam edilsin mi?'
    }

    const ok = await confirmDialog({ title: 'Dersi sil', message, confirmLabel: 'Sil' })
    if (!ok) return

    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) toast.error('Silinemedi: ' + error.message)
    else {
      toast.success('Ders silindi.')
      fetchCourses()
    }
  }

  const dotColors = ['bg-[#1f5c4b]', 'bg-[#1f5c4b]', 'bg-[#a05d25]', 'bg-[#1f5c4b]', 'bg-[#a05d25]']

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Dersler" subtitle="Okulda okutulan tüm dersleri buradan yönet" />

      <PageCard title="Dersler" description="Öğretmen ve blok atamaları Ders Atamaları sayfasından yapılır">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            placeholder="KOD (örn: MAT101)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="w-40 border border-slate-200 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Ders adı (örn: Matematik)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="flex-1 border border-slate-200 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded transition-colors duration-150 shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ekle
          </button>
        </form>

        {fetching ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-[11px] tracking-wider font-semibold text-slate-400">DERS</th>
                <th className="text-right pb-3 text-[11px] tracking-wider font-semibold text-slate-400">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150">
                  <td className="py-3.5">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          placeholder="Kod"
                          className="border border-slate-200 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Ders adı"
                          className="border border-slate-200 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className={'w-2 h-2 rounded shrink-0 ' + dotColors[i % dotColors.length]}></span>
                        <div>
                          <p className="font-medium text-slate-700">{c.course_name}</p>
                          <p className="text-xs text-slate-400">{c.course_code || 'Kod girilmedi'}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === c.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(c.id)}
                            className="w-7 h-7 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-50"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors duration-150"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!fetching && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henüz ders eklenmedi</p>
          </div>
        )}
      </PageCard>
    </div>
  )
}