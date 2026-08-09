import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import SelectField from '../components/SelectField'

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
    const { data, error } = await supabase
      .from('teachers')
      .select('*, branches(name)')
      .order('id')
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
    const { error } = await supabase
      .from('teachers')
      .insert({ full_name: fullName, branch_id: branchId || null })
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
    if (error) alert('Hata: ' + error.message)
    else fetchTeachers()
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ogretmen Yonetimi</h1>
        <p className="text-slate-400 text-sm mt-1">Okuldaki tum ogretmenleri buradan yonet</p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
            <Input
              placeholder="orn: Ayse Yilmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
          <SelectField
            label="Sube (opsiyonel)"
            value={branchId}
            onChange={setBranchId}
            placeholder="-- Sube Sec --"
            className="min-w-[180px]"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
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

        {!fetching && teachers.map((t) => (
          <Card
            key={t.id}
            className="p-4 border-0 shadow-soft shadow-soft-hover rounded-xl flex flex-row justify-between items-center transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm">
                👤
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">{t.full_name}</p>
                <p className="text-xs text-slate-400">
                  {t.branches?.name ? t.branches.name + ' subesi' : 'Subeye bagli degil'}
                </p>
              </div>
            </div>
            <Button
              color="danger"
              variant="light"
              size="sm"
              className="rounded-lg"
              onClick={() => handleDelete(t.id)}
            >
              Sil
            </Button>
          </Card>
        ))}

        {!fetching && teachers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Henuz ogretmen eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  )
}