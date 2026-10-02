import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

const roleLabels = { admin: 'Okul müdürü', editor: 'Editör', teacher: 'Öğretmen' }

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  async function handleSave(event) {
    event.preventDefault()
    if (!fullName.trim()) {
      toast.warning('Ad soyad alanı boş bırakılamaz.')
      return
    }
    if (password && password.length < 6) {
      toast.warning('Yeni şifre en az 6 karakter olmalı.')
      return
    }
    setSaving(true)
    const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id)
    if (profileError) {
      toast.error('Profil güncellenemedi: ' + profileError.message)
      setSaving(false)
      return
    }
    if (password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) {
        toast.error('Şifre güncellenemedi: ' + passwordError.message)
        setSaving(false)
        return
      }
      setPassword('')
    }
    setSaving(false)
    toast.success('Profil bilgileri güncellendi.')
  }

  return (
    <div className="page-canvas profile-page">
      <div className="page-width profile-page-width">
        <PageHeader title="Profil ve güvenlik" subtitle="Hesap bilgilerini ve giriş güvenliğini yönet" eyebrow="Hesabım" />
        <div className="profile-layout">
          <aside className="profile-summary">
            <div className="profile-summary-avatar">{(profile?.full_name || '?').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}</div>
            <h2>{profile?.full_name || 'Kullanıcı'}</h2>
            <p>{roleLabels[profile?.role] || profile?.role}</p>
            <span>{profile?.email || user?.email}</span>
          </aside>
          <div className="profile-forms">
            <PageCard title="Kişisel bilgiler" description="Uygulama içinde görünen adını güncelle.">
              <form onSubmit={handleSave} className="profile-form">
                <label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ad Soyad" /></label>
                <label>Email adresi<input value={profile?.email || user?.email || ''} readOnly /></label>
                <div className="profile-form-note">Email adresi yöneticin tarafından tanımlanır ve buradan değiştirilemez.</div>
                <div className="profile-actions"><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}</button></div>
              </form>
            </PageCard>
            <PageCard title="Şifre değiştir" description="Yeni bir şifre yazarsan mevcut şifren güncellenir. Boş bırakırsan değişiklik yapılmaz.">
              <form onSubmit={handleSave} className="profile-form">
                <label>Yeni şifre<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 6 karakter" minLength="6" /></label>
                <div className="profile-actions"><button type="submit" className="secondary-button" disabled={saving}>Şifreyi güncelle</button></div>
              </form>
            </PageCard>
          </div>
        </div>
      </div>
    </div>
  )
}
