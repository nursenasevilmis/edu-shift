import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

export default function TeacherManager() {
  const [teachers, setTeachers] = useState([])
  const [branches, setBranches] = useState([])
  const [fullName, setFullName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
    fetchBranches()
  }, [])

  async function fetchTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*, branches(name)')
      .order('id')

    if (error) console.error('Öğretmenler alınamadı:', error)
    else setTeachers(data)
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
    if (!confirm('Bu öğretmeni silmek istediğine emin misin?')) return

    const { error } = await supabase.from('teachers').delete().eq('id', id)

    if (error) alert('Hata: ' + error.message)
    else fetchTeachers()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Öğretmen Yönetimi</h1>

      <Card className="p-4 mb-6">
  <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
    <Input
      label="Ad Soyad"
      value={fullName}
      onChange={(e) => setFullName(e.target.value)}
    />
    <select
      value={branchId}
      onChange={(e) => setBranchId(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 h-14 min-w-[160px]"
    >
      <option value="">Şube seç (opsiyonel)</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
    <Button color="primary" type="submit" isLoading={loading}>
      Ekle
    </Button>
  </form>
</Card>

      <div className="flex flex-col gap-2">
        {teachers.map((t) => (
          <Card key={t.id} className="p-3 flex flex-row justify-between items-center">
            <span>{t.full_name} {t.branches?.name && `(${t.branches.name})`}</span>
            <Button color="danger" size="sm" onClick={() => handleDelete(t.id)}>
              Sil
            </Button>
          </Card>
        ))}
        {teachers.length === 0 && (
          <p className="text-gray-500 text-center">Henüz öğretmen eklenmedi.</p>
        )}
      </div>
    </div>
  )
}