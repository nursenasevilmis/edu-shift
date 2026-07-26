import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

export default function BranchManager() {
  const [branches, setBranches] = useState([])
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('id')

    if (error) console.error('Şubeler alınamadı:', error)
    else setBranches(data)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('branches')
      .insert({ name, grade_level: gradeLevel })

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
    if (!confirm('Bu şubeyi silmek istediğine emin misin?')) return

    const { error } = await supabase.from('branches').delete().eq('id', id)

    if (error) alert('Hata: ' + error.message)
    else fetchBranches()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Şube Yönetimi</h1>

      <Card className="p-4 mb-6">
        <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
          <Input
            label="Şube Adı (örn: 10-A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Sınıf Seviyesi (örn: 10)"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
          <Button color="primary" type="submit" isLoading={loading}>
            Ekle
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {branches.map((b) => (
          <Card key={b.id} className="p-3 flex flex-row justify-between items-center">
            <span>{b.name} ({b.grade_level})</span>
            <Button color="danger" size="sm" onClick={() => handleDelete(b.id)}>
              Sil
            </Button>
          </Card>
        ))}
        {branches.length === 0 && (
          <p className="text-gray-500 text-center">Henüz şube eklenmedi.</p>
        )}
      </div>
    </div>
  )
}