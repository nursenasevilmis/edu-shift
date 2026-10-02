import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdminClient'
import { useAuth } from '../contexts/AuthContext'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useToast } from '../contexts/ToastContext'

const roleLabels = { admin: 'Admin', editor: 'Editör', teacher: 'Öğretmen' }

export default function UserManager() {
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [branches, setBranches] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('editor')
  const [branchId, setBranchId] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()

  const fetchProfiles = useCallback(async () => {
    setFetching(true)
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (error) toast.error('Kullanıcılar alınamadı: ' + error.message)
    else setProfiles(data || [])
    setFetching(false)
  }, [toast])

  const fetchBranches = useCallback(async () => {
    const { data } = await supabase.from('branches').select('id, name').order('name')
    setBranches(data || [])
  }, [])

  useEffect(() => { void Promise.resolve().then(() => Promise.all([fetchProfiles(), fetchBranches()])) }, [fetchProfiles, fetchBranches])

  async function handleCreate(event) {
    event.preventDefault()
    if (!email.trim() || !password.trim() || !fullName.trim()) return toast.warning('Ad, email ve şifre alanlarını doldur.')
    if (password.length < 6) return toast.warning('Şifre en az 6 karakter olmalı.')
    if (role === 'teacher' && !branchId) return toast.warning('Öğretmen için bir şube seçmelisin.')
    setLoading(true)
    try {
      const { data, error } = await supabaseAdmin.auth.signUp({ email: email.trim(), password })
      if (error || !data?.user?.id) throw new Error(error?.message || 'Kullanıcı ID alınamadı.')
      const newUserId = data.user.id
      const { error: profileError } = await supabase.from('profiles').insert({ id: newUserId, email: email.trim(), role, full_name: fullName.trim() })
      if (profileError) throw profileError
      if (role === 'teacher') {
        const { error: teacherError } = await supabase.from('teachers').insert({ user_id: newUserId, branch_id: Number(branchId), full_name: fullName.trim() })
        if (teacherError) throw teacherError
      }
      setEmail(''); setPassword(''); setFullName(''); setRole('editor'); setBranchId('')
      await fetchProfiles()
      toast.success('Kullanıcı hesabı oluşturuldu.')
    } catch (error) { toast.error('Kullanıcı oluşturulamadı: ' + error.message) }
    setLoading(false)
  }

  async function handleRoleChange(userId, newRole) {
    if (userId === profile.id) return toast.warning('Kendi admin rolünü bu listeden değiştiremezsin.')
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) toast.error('Rol güncellenemedi: ' + error.message)
    else { toast.success('Rol güncellendi.'); await fetchProfiles() }
  }

  const filteredProfiles = useMemo(() => profiles.filter((item) => `${item.full_name || ''} ${item.email || ''}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')) && (!roleFilter || item.role === roleFilter)), [profiles, query, roleFilter])
  const counts = profiles.reduce((result, item) => { result[item.role] = (result[item.role] || 0) + 1; return result }, {})

  if (profile?.role !== 'admin') return <Navigate to="/branches" />

  return (
    <div className="page-canvas users-page"><div className="page-width users-page-width">
      <PageHeader title="Kullanıcı yönetimi" subtitle="Erişim seviyelerini, okul personeli hesaplarını ve profil rollerini yönet" eyebrow="Yönetim" />
      <div className="user-stats"><div><span>Toplam hesap</span><strong>{profiles.length}</strong></div><div><span>Admin</span><strong>{counts.admin || 0}</strong></div><div><span>Editör</span><strong>{counts.editor || 0}</strong></div><div><span>Öğretmen</span><strong>{counts.teacher || 0}</strong></div></div>
      <PageCard title="Yeni hesap oluştur" description="Editör, öğretmen veya admin hesabı aç. Öğretmen hesabı seçildiğinde şube bağlantısı zorunludur."><form onSubmit={handleCreate} className="user-create-form"><div className="user-create-grid"><label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ahmet Yılmaz" /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ahmet@okul.com" /></label><label>Geçici şifre<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 6 karakter" /></label><SelectField label="Rol" value={role} onChange={(value) => { setRole(value); if (value !== 'teacher') setBranchId('') }} options={[{ value: 'editor', label: 'Editör' }, { value: 'teacher', label: 'Öğretmen' }, { value: 'admin', label: 'Admin' }]} />{role === 'teacher' && <SelectField label="Bağlı şube" value={branchId} onChange={setBranchId} placeholder="Şube seç" options={branches.map((branch) => ({ value: String(branch.id), label: branch.name }))} />}</div><div className="user-create-footer"><span>Yeni kullanıcı ilk girişini bu bilgilerle yapar.</span><button type="submit" className="primary-button" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Hesabı oluştur'}</button></div></form></PageCard>
      <PageCard title="Erişim dizini" description={`${filteredProfiles.length} kullanıcı gösteriliyor`}><div className="user-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İsim veya email ara" /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">Tüm roller</option><option value="admin">Admin</option><option value="editor">Editör</option><option value="teacher">Öğretmen</option></select></div><div className="user-directory">{fetching ? <div className="directory-loading" /> : filteredProfiles.map((item) => <div className="user-row" key={item.id}><div className="user-row-avatar">{(item.full_name || '?').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}</div><div className="user-row-main"><strong>{item.full_name || 'İsimsiz kullanıcı'}</strong><span>{item.email}</span></div><div className="user-row-role"><SelectField value={item.role} onChange={(value) => handleRoleChange(item.id, value)} disabled={item.id === profile.id} options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} />{item.id === profile.id && <small>Senin hesabın</small>}</div></div>)}{!fetching && filteredProfiles.length === 0 && <div className="directory-empty">Filtrelere uyan kullanıcı bulunamadı.</div>}</div></PageCard>
    </div></div>
  )
}
