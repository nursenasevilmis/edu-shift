import { useState } from 'react'
import { Input } from '@heroui/react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'
import { ArrowRight, CheckCircle2, LockKeyhole } from '../components/UiMarks'

function BrandLockup({ dark = false }) {
  return (
    <div className={'brand-lockup ' + (dark ? 'text-[#111827]' : '')}>
      <span className="brand-chip">ES</span>
      <span>
        <span className="brand-name">EduShift</span>
        <span className="brand-subtitle">School operations</span>
      </span>
    </div>
  )
}

function SchedulePreview() {
  return (
    <motion.div
      className="auth-board"
      aria-label="Haftalık program önizlemesi"
      initial={{ opacity: 0, y: 18, rotate: -7 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={{ delay: .35, duration: .7, ease: [.2, .8, .2, 1] }}
    >
      <div className="auth-board-top"><span>Program dosyası / 2026</span><span>Hazır</span></div>
      <div className="auth-board-row">
        <span className="auth-board-label">09:00</span><span className="is-active">MAT</span><span>FEN</span><span className="is-accent">TÜRK</span><span>İNG</span><span>GÖR</span>
      </div>
      <div className="auth-board-row">
        <span className="auth-board-label">10:00</span><span>FEN</span><span className="is-active">MAT</span><span>BED</span><span className="is-active">TÜRK</span><span>İNG</span>
      </div>
      <div className="auth-board-row">
        <span className="auth-board-label">11:00</span><span>İNG</span><span className="is-accent">TÜRK</span><span>MAT</span><span>FEN</span><span className="is-active">GÖR</span>
      </div>
      <div className="auth-board-row">
        <span className="auth-board-label">12:00</span><span className="is-active">BED</span><span>FEN</span><span>MAT</span><span>İNG</span><span>TÜRK</span>
      </div>
    </motion.div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')
  const [resetLoading, setResetLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) setError('Email veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.')
    else navigate('/')
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email.trim()) {
      toast.warning('Önce email adresini gir.')
      return
    }
    setResetLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })
    setResetLoading(false)
    if (resetError) toast.error('Bir hata oluştu: ' + resetError.message)
    else {
      toast.success('Şifre sıfırlama bağlantısı email adresine gönderildi.')
      setMode('login')
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-side">
        <div className="auth-topline">
          <BrandLockup />
          <span className="auth-meta">20 Eylül 2026<br />Yetkili erişim</span>
        </div>

        <motion.div className="auth-story" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [.2, .8, .2, 1] }}>
          <p className="auth-overline">Haftalık program dosyası</p>
          <h1>Okulun haftası, tek bir netlikte.</h1>
          <p className="auth-story-copy">Şube, ders, öğretmen ve zaman kısıtlarını aynı çalışma alanında toparla. Çakışmaları gör, boşlukları tamamla, programı güvenle paylaş.</p>
          <div className="auth-workflow" aria-label="EduShift çalışma akışı">
            <div className="auth-step"><span className="auth-step-number">01</span><span>Kayıtları topla</span></div>
            <span className="auth-step-line" />
            <div className="auth-step"><span className="auth-step-number">02</span><span>Kontrol et</span></div>
            <span className="auth-step-line" />
            <div className="auth-step"><span className="auth-step-number">03</span><span>Yayınla</span></div>
          </div>
        </motion.div>

        <SchedulePreview />
        <div className="auth-footer"><span>EduShift / School operations</span><span>v2.0</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand"><BrandLockup dark /></div>
          <div className="auth-heading">
            <p className="section-kicker">Çalışma alanına giriş</p>
            <h2>{mode === 'login' ? 'Tekrar hoş geldin.' : 'Şifreni yenile.'}</h2>
            <p>{mode === 'login' ? 'Okulunun haftalık program dosyasını kaldığın yerden aç.' : 'Email adresine güvenli bir yenileme bağlantısı göndereceğiz.'}</p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">Email adresi</label>
                <Input id="login-email" type="email" placeholder="müdür@okul.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
              </div>
              <div className="auth-field">
                <div className="auth-field-head">
                  <label htmlFor="login-password" className="auth-label">Şifre</label>
                  <button type="button" onClick={() => setMode('forgot')} className="auth-link">Şifremi unuttum</button>
                </div>
                <Input id="login-password" type="password" placeholder="Şifreni gir" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
              </div>
              {error && <p className="auth-alert" role="alert">{error}</p>}
              <button type="submit" disabled={loading} className="primary-button auth-submit">{loading ? 'Giriş yapılıyor...' : <>Çalışma alanını aç <ArrowRight size={16} /></>}</button>
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]"><CheckCircle2 size={15} className="text-[#6d9d20]" /> Güvenli okul operasyonu</div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reset-email" className="auth-label">Email adresi</label>
                <Input id="reset-email" type="email" placeholder="müdür@okul.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
              </div>
              <button type="submit" disabled={resetLoading} className="primary-button auth-submit">{resetLoading ? 'Gönderiliyor...' : <>Yenileme bağlantısı gönder <ArrowRight size={16} /></>}</button>
              <button type="button" onClick={() => setMode('login')} className="auth-back">Girişe geri dön</button>
            </form>
          )}

          <div className="auth-legal"><LockKeyhole size={14} /><a href="/terms">Kullanım şartları</a><a href="/privacy">Gizlilik</a><span>Yalnızca yetkili okul personeli</span></div>
        </div>
      </section>
    </main>
  )
}
