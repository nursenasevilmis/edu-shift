import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdminClient'
import { useAuth } from '../contexts/AuthContext'

export default function UserManager() {
  const { profile } = useAuth()

  const [profiles, setProfiles] = useState([])
  const [teachers, setTeachers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('editor')
  const [linkedTeacherId, setLinkedTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchProfiles()
    fetchUnlinkedTeachers()
  }, [])

  if (profile?.role !== 'admin') {
    return <Navigate to="/branches" />
  }

  async function fetchProfiles() {
    setFetching(true)
    const { data, error } = await supabase.from('profiles').select('*').order('email')
    if (error) console.error(error)
    else setProfiles(data)
    setFetching(false)
  }

  async function fetchUnlinkedTeachers() {
    const { data, error } = await supabase.from('teachers').select('*').is('user_id', null)
    if (error) console.error(error)
    else setTeachers(data)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      alert('Lutfen tum alanlari doldur.')
      return
    }
    if (password.length < 6) {
      alert('Sifre en az 6 karakter olmali.')
      return
    }

    setLoading(true)

    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      alert('Kullanici olusturulamadi: ' + signUpError.message)
      setLoading(false)
      return
    }

    const newUserId = signUpData.user.id

    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUserId,
      email,
      role,
      full_name: fullName,
    })

    if (profileError) {
      alert('Profil olusturulamadi: ' + profileError.message)
      setLoading(false)
      return
    }

    if (role === 'teacher' && linkedTeacherId) {
      const { error: linkError } = await supabase
        .from('teachers')
        .update({ user_id: newUserId })
        .eq('id', linkedTeacherId)

      if (linkError) {
        alert('Ogretmen kaydina baglanamadi: ' + linkError.message)
      }
    }

    setLoading(false)
    setEmail('')
    setPassword('')
    setFullName('')
    setLinkedTeacherId('')
    fetchProfiles()
    fetchUnlinkedTeachers()
    alert('Kullanici olusturuldu.')
  }

  const roleLabels = { admin: 'Admin', editor: 'Editor', teacher: 'Ogretmen' }
  const roleColors = {
    admin: 'bg-rose-50 text-rose-600',
    editor: 'bg-blue-50 text-blue-600',
    teacher: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kullanici Yonetimi</h1>
        <p className="text-slate-400 text-sm mt-1">
          Yeni editor veya ogretmen hesabi olustur
        </p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
              <Input
                placeholder="orn: Ahmet Yilmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Email</label>
              <Input
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Sifre</label>
              <Input
                type="password"
                placeholder="en az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="editor">Editor</option>
                <option value="teacher">Ogretmen</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {role === 'teacher' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Ogretmen Kaydina Bagla</label>
                <select
                  value={linkedTeacherId}
                  onChange={(e) => setLinkedTeacherId(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 h-10 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Baglama --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              className="rounded-xl font-medium"
            >
              Kullanici Olustur
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="font-semibold text-sm text-slate-600 mb-3">Mevcut Kullanicilar</h2>
      <div className="flex flex-col gap-2">
        {fetching && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        )}

        {!fetching && profiles.map((p) => (
          <Card
            key={p.id}
            className="p-4 border-0 shadow-soft shadow-soft-hover rounded-xl flex flex-row justify-between items-center transition-all duration-200"
          >
            <div>
              <p className="font-medium text-slate-700 text-sm">{p.full_name}</p>
              <p className="text-xs text-slate-400">{p.email}</p>
            </div>
            <span className={'text-xs px-2.5 py-1 rounded-lg font-medium ' + (roleColors[p.role] || 'bg-slate-50 text-slate-500')}>
              {roleLabels[p.role] || p.role}
            </span>
          </Card>
        ))}
      </div>
    </div>
  )
}