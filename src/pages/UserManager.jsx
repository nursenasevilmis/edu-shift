import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Input } from '@heroui/react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdminClient'
import { useAuth } from '../contexts/AuthContext'
import SelectField from '../components/SelectField'

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
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({ email, password })

    if (signUpError) {
      alert('Kullanici olusturulamadi: ' + signUpError.message)
      setLoading(false)
      return
    }

    const newUserId = signUpData.user.id
    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUserId, email, role, full_name: fullName,
    })

    if (profileError) {
      alert('Profil olusturulamadi: ' + profileError.message)
      setLoading(false)
      return
    }

    if (role === 'teacher' && linkedTeacherId) {
      await supabase.from('teachers').update({ user_id: newUserId }).eq('id', linkedTeacherId)
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

  async function handleRoleChange(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) alert('Hata: ' + error.message)
    else fetchProfiles()
  }

  const roleLabels = { admin: 'Admin', editor: 'Editor', teacher: 'Ogretmen' }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Kullanicilar ve Roller</h1>
          <p className="text-slate-400 text-sm mt-1">Erisim seviyelerini ve bagli ogretmen hesaplarini yonet</p>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Sistem calisiyor
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-50 p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-1">Yeni Hesap Olustur</h2>
        <p className="text-xs text-slate-400 mb-4">Editor veya ogretmen icin yeni bir giris hesabi ac</p>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
              <Input placeholder="orn: Ahmet Yilmaz" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Email</label>
              <Input type="email" placeholder="ornek@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Sifre</label>
              <Input type="password" placeholder="en az 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 items-end flex-wrap">
            <SelectField
              label="Rol"
              value={role}
              onChange={setRole}
              options={[
                { value: 'editor', label: 'Editor' },
                { value: 'teacher', label: 'Ogretmen' },
                { value: 'admin', label: 'Admin' },
              ]}
            />

            {role === 'teacher' && (
              <SelectField
                label="Ogretmen Kaydina Bagla"
                value={linkedTeacherId}
                onChange={setLinkedTeacherId}
                placeholder="-- Baglama --"
                className="min-w-[180px]"
                options={teachers.map((t) => ({ value: t.id, label: t.full_name }))}
              />
            )}

            <Button color="primary" type="submit" isLoading={loading} className="rounded-xl font-medium">
              Kullanici Olustur
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-700">Erisim Dizini</h2>
            <p className="text-xs text-slate-400 mt-1">Kayitli hesaplarin yetki seviyesini ayarla</p>
          </div>
          <ShieldCheck size={18} className="text-blue-500" />
        </div>

        {fetching ? (
          <div className="p-6">
            <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-50">
                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">KULLANICI</th>
                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">EMAIL</th>
                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">ERISIM SEVIYESI</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-slate-700">{p.full_name}</td>
                  <td className="px-6 py-4 text-slate-400">{p.email}</td>
                  <td className="px-6 py-4">
                    <SelectField
                      value={p.role}
                      onChange={(newRole) => handleRoleChange(p.id, newRole)}
                      className="min-w-[130px]"
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'editor', label: 'Editor' },
                        { value: 'teacher', label: 'Ogretmen' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}