import { useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [resetLoading, setResetLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    setLoading(false)

    if (error) {
      setError('Email veya şifre hatalı.')
    } else {
      navigate('/')
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email.trim()) {
      toast.warning('Önce email adresini gir.')
      return
    }

    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setResetLoading(false)

    if (error) {
      toast.error('Bir hata oluştu: ' + error.message)
    } else {
      toast.success('Şifre sıfırlama linki email adresine gönderildi.')
      setMode('login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 border-0 shadow-soft rounded-2xl">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
            E
          </div>
          <h1 className="text-xl font-bold text-slate-800">EduSchedule</h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Hesabına giriş yap' : 'Şifreni sıfırla'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Email</label>
              <Input
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Şifre</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-rose-500 text-xs bg-rose-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              className="rounded-xl font-medium mt-2"
            >
              Giriş Yap
            </Button>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-xs text-slate-400 hover:text-blue-600 transition-colors duration-150 text-center"
            >
              Şifremi unuttum
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <p className="text-xs text-slate-500 -mt-2">
              Email adresini gir, sana şifre sıfırlama linki gönderelim.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Email</label>
              <Input
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              color="primary"
              type="submit"
              isLoading={resetLoading}
              className="rounded-xl font-medium mt-2"
            >
              Sıfırlama Linki Gönder
            </Button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-slate-400 hover:text-blue-600 transition-colors duration-150 text-center"
            >
              Girişe geri dön
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}