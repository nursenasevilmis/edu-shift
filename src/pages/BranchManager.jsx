import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

export default function BranchManager() {
  const [branches, setBranches] = useState([])
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    setFetching(true)
    const { data, error } = await supabase.from('branches').select('*').order('id')
    if (error) console.error('Subeler alinamadi:', error)
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
      alert('Hata: ' + error.message)
    } else {
      setName('')
      setGradeLevel('')
      fetchBranches()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu subeyi silmek istedigine emin misin?')) return
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) alert('Hata: ' + error.message)
    else fetchBranches()
  }

  const colors = ['bg-blue-50 text-blue-600', 'bg-violet-50 text-violet-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600']

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Subeler" subtitle="Okuldaki tum subeleri buradan yonet" />

      <PageCard title="Subeler" description="Ders programi sutunlarinda kullanilan sinif subeleri">
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            placeholder="9-A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Sinif seviyesi (orn: 10)"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="flex-[2] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {branches.map((b, i) => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
              >
                <div className={'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ' + colors[i % colors.length]}>
                  {b.name}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{b.name}</p>
                  <p className="text-xs text-slate-400">
                    {b.grade_level ? b.grade_level + '. Sinif Subesi' : 'Seviye girilmedi'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-200 transition-colors duration-150">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!fetching && branches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz sube eklenmedi</p>
          </div>
        )}
      </PageCard>
    </div>
  )
}