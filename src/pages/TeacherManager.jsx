import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from '../components/UiMarks'
import { supabase } from '../supabaseClient'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

export default function TeacherManager() {
  const [teachers, setTeachers] = useState([])
  const [branches, setBranches] = useState([])
  const [fullName, setFullName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editBranchId, setEditBranchId] = useState('')
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    fetchTeachers()
    fetchBranches()
  }, [])

  async function fetchTeachers() {
    setFetching(true)
    const { data, error } = await supabase.from('teachers').select('*, branches(name)').order('id')
    if (error) console.error('Öğretmenler alınamadı:', error)
    else setTeachers(data)
    setFetching(false)
  }

  async function fetchBranches() {
    const { data, error } = await supabase.from('branches').select('*').order('id')
    if (error) console.error('Şubeler alınamadı:', error)
    else setBranches(data)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!fullName.trim()) return

    setLoading(true)
    const { error } = await supabase.from('teachers').insert({ full_name: fullName, branch_id: branchId || null })
    setLoading(false)

    if (error) {
      toast.error('Öğretmen eklenemedi: ' + error.message)
    } else {
      toast.success('Öğretmen eklendi.')
      setFullName('')
      setBranchId('')
      fetchTeachers()
    }
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditName(t.full_name)
    setEditBranchId(t.branch_id ? String(t.branch_id) : '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id) {
    if (!editName.trim()) {
      toast.warning('Ad soyad boş olamaz.')
      return
    }
    const { error } = await supabase
      .from('teachers')
      .update({ full_name: editName, branch_id: editBranchId || null })
      .eq('id', id)

    if (error) {
      toast.error('Güncellenemedi: ' + error.message)
    } else {
      toast.success('Öğretmen güncellendi.')
      setEditingId(null)
      fetchTeachers()
    }
  }

  async function handleDelete(id, name) {
    const { count } = await supabase
      .from('course_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', id)

    const assignmentCount = count || 0

    if (assignmentCount > 0) {
      toast.warning(
        name + ' silinemedi çünkü ' + assignmentCount + ' ders atamasında kayıtlı. Önce Ders Atamaları sayfasından bu öğretmenin atamalarını kaldır.'
      )
      return
    }

    const ok = await confirmDialog('Bu öğretmeni silmek istediğine emin misin? Bu işlem geri alınamaz.')
    if (!ok) return

    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) {
      toast.error('Silinemedi: ' + error.message)
    } else {
      toast.success('Öğretmen silindi.')
      fetchTeachers()
    }
  }

  const colors = ['bg-[#1f5c4b]', 'bg-[#1f5c4b]', 'bg-[#a05d25]', 'bg-[#1f5c4b]', 'bg-[#a05d25]', 'bg-[#1f5c4b]']

  function initialsOf(name) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Öğretmenler" subtitle="Okuldaki tüm öğretmen profillerini buradan yönet" />

      <PageCard title="Öğretmen Profilleri" description="Profiller, öğretmen sahipliği ve kısıt tanımları için temel kaynaktır">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6 flex-wrap">
          <input
            placeholder="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex-1 min-w-[180px] border border-slate-200 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SelectField
            value={branchId}
            onChange={setBranchId}
            placeholder="Şube (opsiyonel)"
            className="min-w-[160px]"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
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
          <div className="grid md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded animate-pulse"></div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henüz öğretmen eklenmedi</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {teachers.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded bg-slate-50 hover:bg-slate-100 transition-colors duration-150">
                {editingId === t.id ? (
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <SelectField
                      value={editBranchId}
                      onChange={setEditBranchId}
                      placeholder="Şube (opsiyonel)"
                      options={branches.map((b) => ({ value: b.id, label: b.name }))}
                    />
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => saveEdit(t.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-100"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-200"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={'w-11 h-11 rounded flex items-center justify-center text-white font-bold text-sm shrink-0 ' + colors[i % colors.length]}>
                      {initialsOf(t.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{t.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {t.branches?.name ? t.branches.name + ' şubesi' : 'Şubeye bağlı değil'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-200 transition-colors duration-150"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.full_name)}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  )
}