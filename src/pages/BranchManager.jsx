import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sube Yonetimi</h1>
        <p className="text-slate-400 text-sm mt-1">Okuldaki tum subeleri buradan yonet</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Sube Adi</label>
            <Input
              placeholder="orn: 10-A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Sinif Seviyesi</label>
            <Input
              placeholder="orn: 10"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="max-w-[140px]"
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
        {!fetching && branches.map((b) => (
          <Card
            key={b.id}
            className="p-4 border-0 shadow-soft shadow-soft-hover rounded-xl flex flex-row justify-between items-center transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 text-sm">
                🏫
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">{b.name}</p>
                <p className="text-xs text-slate-400">
                  {b.grade_level ? b.grade_level + '. Sinif Subesi' : 'Sinif seviyesi belirtilmedi'}
                </p>
              </div>
            </div>
            <Button
              color="danger"
              variant="light"
              size="sm"
              className="rounded-lg"
              onClick={() => handleDelete(b.id)}
            >
              Sil
            </Button>
          </Card>
        ))}

        {!fetching && branches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz sube eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  )
}