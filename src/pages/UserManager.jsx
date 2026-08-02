import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdminClient'
import { useAuth } from '../contexts/AuthContext'

export default function UserManager() {

  const [profiles, setProfiles] = useState([])
  const [teachers, setTeachers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('editor')
  const [linkedTeacherId, setLinkedTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { profile } = useAuth()
  if (profile?.role !== 'admin') {
    return <Navigate to="/branches" />
  }

  useEffect(() => {
    fetchProfiles()
    fetchUnlinkedTeachers()
  }, [])

  async function fetchProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('email')
    if (error) console.error(error)
    else setProfiles(data)
  }

  async function fetchUnlinkedTeachers() {
    // user_id'si boş olan, yani henüz bir hesaba bağlanmamış öğretmenler
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .is('user_id', null)
    if (error) console.error(error)
    else setTeachers(data)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      alert('Lütfen tüm alanları doldur.')
      return
    }
    if (password.length < 6) {
      alert('Şifre en az 6 karakter olmalı.')
      return
    }

    setLoading(true)

    // 1. Yeni auth kullanıcısı oluştur (ayrı client ile, admin oturumu bozulmadan)
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      alert('Kullanıcı oluşturulamadı: ' + signUpError.message)
      setLoading(false)
      return
    }

    const newUserId = signUpData.user.id

    // 2. profiles tablosuna kaydet
    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUserId,
      email,
      role,
      full_name: fullName,
    })

    if (profileError) {
      alert('Profil oluşturulamadı: ' + profileError.message)
      setLoading(false)
      return
    }

    // 3. Eğer rol öğretmense ve bir teacher kaydı seçildiyse, bağla
    if (role === 'teacher' && linkedTeacherId) {
      const { error: linkError } = await supabase
        .from('teachers')
        .update({ user_id: newUserId })
        .eq('id', linkedTeacherId)

      if (linkError) {
        alert('Öğretmen kaydına bağlanamadı: ' + linkError.message)
      }
    }

    setLoading(false)
    setEmail('')
    setPassword('')
    setFullName('')
    setLinkedTeacherId('')
    fetchProfiles()
    fetchUnlinkedTeachers()
    alert('Kullanıcı oluşturuldu.')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Kullanıcı Yönetimi</h1>
      <p className="text-gray-500 text-sm mb-4">
        Yeni editör veya öğretmen hesabı oluştur. Öğretmen hesabı, mevcut bir öğretmen kaydına bağlanabilir.
      </p>

      <Card className="p-4 mb-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <Input
              label="Ad Soyad"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Şifre"
              type="password"
              placeholder="en az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium block mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="editor">Editör</option>
                <option value="teacher">Öğretmen</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {role === 'teacher' && (
              <div>
                <label className="text-sm font-medium block mb-1">Öğretmen Kaydına Bağla (opsiyonel)</label>
                <select
                  value={linkedTeacherId}
                  onChange={(e) => setLinkedTeacherId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Bağlama --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            <Button color="primary" type="submit" isLoading={loading}>
              Kullanıcı Oluştur
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="font-semibold mb-2 text-sm text-gray-600">Mevcut Kullanıcılar</h2>
      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <Card key={p.id} className="p-3 flex flex-row justify-between items-center">
            <span>
              <strong>{p.full_name}</strong> — {p.email}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{p.role}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}