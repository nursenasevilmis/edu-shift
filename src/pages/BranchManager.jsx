import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Search } from '../components/UiMarks'
import { supabase } from '../supabaseClient'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

export default function BranchManager() {
  const [branches, setBranches] = useState([])
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    setFetching(true)
    const { data, error } = await supabase.from('branches').select('*').order('id')
    if (error) console.error('Şubeler alınamadı:', error)
    else setBranches(data)
    setFetching(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const { error } = await supabase.from('branches').insert({ name, grade_level: gradeLevel })
    setLoading(false)

    if (error) {
      toast.error('Şube eklenemedi: ' + error.message)
    } else {
      toast.success('Şube eklendi.')
      setName('')
      setGradeLevel('')
      fetchBranches()
    }
  }

  function startEdit(b) {
    setEditingId(b.id)
    setEditName(b.name)
    setEditGrade(b.grade_level || '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id) {
    if (!editName.trim()) {
      toast.warning('Şube adı boş olamaz.')
      return
    }
    const { error } = await supabase
      .from('branches')
      .update({ name: editName, grade_level: editGrade })
      .eq('id', id)

    if (error) {
      toast.error('Güncellenemedi: ' + error.message)
    } else {
      toast.success('Şube güncellendi.')
      setEditingId(null)
      fetchBranches()
    }
  }

  async function handleDelete(id) {
    // Silmeden önce, bu şubeye bağlı kaç kayıt etkileneceğini gösterelim
    const [assignmentsRes, schedulesRes] = await Promise.all([
      supabase.from('course_assignments').select('id', { count: 'exact', head: true }).eq('branch_id', id),
      supabase.from('schedules').select('id', { count: 'exact', head: true }).eq('branch_id', id),
    ])

    const assignmentCount = assignmentsRes.count || 0
    const scheduleCount = schedulesRes.count || 0

    let message = 'Bu şubeyi silmek istediğine emin misin? Bu işlem geri alınamaz.'
    if (assignmentCount > 0 || scheduleCount > 0) {
      message =
        'Bu şubeyi silersen, bağlı ' + assignmentCount + ' ders ataması ve ' + scheduleCount +
        ' programa yerleştirilmiş ders saati de birlikte silinecek. Devam edilsin mi?'
    }

    const ok = await confirmDialog({ title: 'Şubeyi sil', message, confirmLabel: 'Sil' })
    if (!ok) return

    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) toast.error('Silinemedi: ' + error.message)
    else {
      toast.success('Şube silindi.')
      fetchBranches()
    }
  }

  const colors = ['bg-[#dce8df] text-[#1f5c4b]', 'bg-[#dce8df] text-[#1f5c4b]', 'bg-[#dce8df] text-[#1f5c4b]', 'bg-[#efe5d3] text-[#a05d25]']
  const filteredBranches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return branches
    return branches.filter((b) =>
      (b.name || '').toLocaleLowerCase('tr').includes(q) ||
      String(b.grade_level || '').toLocaleLowerCase('tr').includes(q)
    )
  }, [branches, query])

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Şubeler" subtitle="Okuldaki tüm şubeleri buradan yönet" />

      <PageCard title="Şubeler" description="Ders programı sütunlarında kullanılan sınıf şubeleri">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            placeholder="9-A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-slate-200 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Sınıf seviyesi (örn: 10)"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="flex-[2] border border-slate-200 rounded px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {branches.length > 0 && (
          <div className="relative mb-5">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Şube adı veya sınıf seviyesine göre ara..."
              className="w-full border border-slate-200 rounded pl-9 pr-3 py-2 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {fetching ? (
          <div className="grid md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {filteredBranches.map((b, i) => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-4 rounded bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
              >
                {editingId === b.id ? (
                  <>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <input
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        placeholder="Sınıf seviyesi"
                        className="border border-slate-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => saveEdit(b.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-50"
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
                  </>
                ) : (
                  <>
                    <div className={'w-11 h-11 rounded flex items-center justify-center font-bold text-sm shrink-0 ' + colors[i % colors.length]}>
                      {b.name}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{b.name}</p>
                      <p className="text-xs text-slate-400">
                        {b.grade_level ? b.grade_level + '. Sınıf Şubesi' : 'Seviye girilmedi'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(b)}
                        className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-200 transition-colors duration-150"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
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

        {!fetching && branches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henüz şube eklenmedi</p>
          </div>
        )}
        {!fetching && branches.length > 0 && filteredBranches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">"{query}" ile eşleşen şube bulunamadı</p>
          </div>
        )}
      </PageCard>
    </div>
  )
}