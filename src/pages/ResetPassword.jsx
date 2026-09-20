import { useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()

    if (password.length < 6) {
      toast.warning('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== confirmPassword) {
      toast.warning('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Şifre güncellenemedi: ' + error.message)
    } else {
      toast.success('Şifren güncellendi, giriş yapabilirsin.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 border-0 shadow-soft rounded-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-800">Yeni Şifre Belirle</h1>
          <p className="text-xs text-slate-400 mt-1">Hesabın için yeni bir şifre gir</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Yeni Şifre</label>
            <Input
              type="password"
              placeholder="en az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Yeni Şifre (Tekrar)</label>
            <Input
              type="password"
              placeholder="şifreyi tekrar gir"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button color="primary" type="submit" isLoading={loading} className="rounded-xl font-medium mt-2">
            Şifreyi Güncelle
          </Button>
        </form>
      </Card>
    </div>
  )
}