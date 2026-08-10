import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, User } from 'lucide-react'
import { supabase } from '../supabaseClient'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

export default function TeacherManager() {
  const [teachers, setTeachers] = useState([])
  const [branches, setBranches] = useState([])
  const [fullName, setFullName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchTeachers()
    fetchBranches()
  }, [])

  async function fetchTeachers() {
    setFetching(true)
    const { data, error } = await supabase.from('teachers').select('*, branches(name)').order('id')
    if (error) console.error('Ogretmenler alinamadi:', error)
    else setTeachers(data)
    setFetching(false)
  }

  async function fetchBranches() {
    const { data, error } = await supabase.from('branches').select('*').order('id')
    if (error) console.error('Subeler alinamadi:', error)
    else setBranches(data)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!fullName.trim()) return

    setLoading(true)
    const { error } = await supabase.from('teachers').insert({ full_name: fullName, branch_id: branchId || null })
    setLoading(false)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      setFullName('')
      setBranchId('')
      fetchTeachers()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu ogretmeni silmek istedigine emin misin?')) return
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) {
      if (error.message.includes('foreign key constraint')) {
        alert('Bu ogretmen silinemedi cunku ders atamalarinda kayitli. Once "Ders Atamalari" sayfasindan bu ogretmenin atamalarini kaldir.')
      } else {
        alert('Hata: ' + error.message)
      }
    } else {
      fetchTeachers()
    }
  }

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500']

  function initialsOf(name) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Ogretmenler" subtitle="Okuldaki tum ogretmen profillerini buradan yonet" />

      <PageCard title="Ogretmen Profilleri" description="Profiller, ogretmen sahipligi ve kisit tanimlari icin temel kaynaktir">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6 flex-wrap">
          <input
            placeholder="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex-1 min-w-[180px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SelectField
            value={branchId}
            onChange={setBranchId}
            placeholder="Sube (opsiyonel)"
            className="min-w-[160px]"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
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
          <div className="grid md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz ogretmen eklenmedi</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {teachers.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-150">
                <div className={'w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ' + colors[i % colors.length]}>
                  {initialsOf(t.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{t.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {t.branches?.name ? t.branches.name + ' subesi' : 'Subeye bagli degil'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-200 transition-colors duration-150">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  )
}