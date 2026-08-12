import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Input } from '@heroui/react'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { supabaseAdmin } from '../supabaseAdminClient'
import { useAuth } from '../contexts/AuthContext'
import SelectField from '../components/SelectField'
import { useToast } from '../contexts/ToastContext'

export default function UserManager() {
  const { profile } = useAuth()

  const [profiles, setProfiles] = useState([])
  const [branches, setBranches] = useState([])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('editor')
  const [branchId, setBranchId] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const toast = useToast()

  useEffect(() => {
    fetchProfiles()
    fetchBranches()
  }, [])

  if (profile?.role !== 'admin') {
    return <Navigate to="/branches" />
  }

  // --------------------------------------------------
  // PROFİLLERİ GETİR
  // --------------------------------------------------
  async function fetchProfiles() {
    setFetching(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email')

    if (error) {
      console.error('Profiller alınamadı:', error)
    } else {
      setProfiles(data || [])
    }

    setFetching(false)
  }

  // --------------------------------------------------
  // ŞUBELERİ GETİR
  // --------------------------------------------------
  async function fetchBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Şubeler alınamadı:', error)
    } else {
      setBranches(data || [])
    }
  }

  // --------------------------------------------------
  // YENİ KULLANICI OLUŞTUR
  // --------------------------------------------------
  async function handleCreate(e) {
    e.preventDefault()

    // Genel alanlar
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      toast.warning('Lütfen tüm alanları doldur.')
      return
    }

    // Şifre kontrolü
    if (password.length < 6) {
      toast.warning('Şifre en az 6 karakter olmalı.')
      return
    }

    // Öğretmen için şube zorunlu
    if (role === 'teacher' && !branchId) {
      toast.warning('Öğretmen için bir şube seçmelisin.')
      return
    }

    setLoading(true)

    try {
      // ==================================================
      // 1. SUPABASE AUTH KULLANICISI OLUŞTUR
      // ==================================================

      const {
        data: signUpData,
        error: signUpError,
      } = await supabaseAdmin.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        throw new Error(
          'Kullanıcı oluşturulamadı: ' + signUpError.message
        )
      }

      const newUserId = signUpData?.user?.id

      if (!newUserId) {
        throw new Error(
          'Kullanıcı oluşturuldu fakat kullanıcı ID alınamadı.'
        )
      }

      console.log('Yeni kullanıcı oluşturuldu:', newUserId)

      // ==================================================
      // 2. PROFILES TABLOSUNA KAYIT
      // ==================================================

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          email: email.trim(),
          role: role,
          full_name: fullName.trim(),
        })

      if (profileError) {
        throw new Error(
          'Profil oluşturulamadı: ' + profileError.message
        )
      }

      console.log('Profile oluşturuldu.')

      // ==================================================
      // 3. EĞER ÖĞRETMENSE TEACHERS KAYDI OLUŞTUR
      // ==================================================

      if (role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: newUserId,
            branch_id: Number(branchId),
            full_name: fullName.trim(),
          })

        if (teacherError) {
          console.error(
            'Öğretmen kaydı oluşturulamadı:',
            teacherError
          )

          throw new Error(
            'Öğretmen kaydı oluşturulamadı: ' +
              teacherError.message
          )
        }

        console.log('Teacher kaydı oluşturuldu.')
      }

      // ==================================================
      // 4. FORMU TEMİZLE
      // ==================================================

      setEmail('')
      setPassword('')
      setFullName('')
      setRole('editor')
      setBranchId('')

      // ==================================================
      // 5. LİSTEYİ YENİLE
      // ==================================================

      await fetchProfiles()

      // ==================================================
      // 6. BAŞARI MESAJI
      // ==================================================

      if (role === 'teacher') {
        toast.success(
          'Öğretmen hesabı oluşturuldu. Kullanıcı artık sisteme giriş yapabilir.'
        )
      } else {
        toast.success('Kullanıcı başarıyla oluşturuldu.')
      }
    } catch (error) {
      console.error(
        'Kullanıcı oluşturma hatası:',
        error
      )

      toast.error(
        error.message ||
          'Kullanıcı oluşturulurken bir hata oluştu.'
      )
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // ROL DEĞİŞTİR
  // --------------------------------------------------
  async function handleRoleChange(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
      })
      .eq('id', userId)

    if (error) {
      toast.error('Hata: ' + error.message)
      return
    }

    toast.success('Rol güncellendi.')

    await fetchProfiles()
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="p-4 md:p-8">

      {/* ==================================================
          BAŞLIK
      ================================================== */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Kullanıcılar ve Roller
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            Erişim seviyelerini ve kullanıcı hesaplarını yönet
          </p>
        </div>

        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Sistem çalışıyor
        </span>
      </div>

      {/* ==================================================
          YENİ HESAP OLUŞTUR
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-soft border border-slate-50 p-6 mb-6">

        <h2 className="font-semibold text-slate-700 mb-1">
          Yeni Hesap Oluştur
        </h2>

        <p className="text-xs text-slate-400 mb-4">
          Editor, öğretmen veya admin için yeni bir giriş hesabı oluştur
        </p>

        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4"
        >

          {/* ==================================================
              AD - EMAIL - ŞİFRE
          ================================================== */}

          <div className="flex gap-3 flex-wrap">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Ad Soyad
              </label>

              <Input
                placeholder="örn: Ahmet Yılmaz"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Email
              </label>

              <Input
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Şifre
              </label>

              <Input
                type="password"
                placeholder="en az 6 karakter"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </div>

          </div>

          {/* ==================================================
              ROL + ŞUBE
          ================================================== */}

          <div className="flex gap-3 items-end flex-wrap">

            <SelectField
              label="Rol"
              value={role}
              onChange={(value) => {
                setRole(value)

                // Öğretmen değilse şube seçimini temizle
                if (value !== 'teacher') {
                  setBranchId('')
                }
              }}
              options={[
                {
                  value: 'editor',
                  label: 'Editor',
                },
                {
                  value: 'teacher',
                  label: 'Öğretmen',
                },
                {
                  value: 'admin',
                  label: 'Admin',
                },
              ]}
            />

            {/* ÖĞRETMEN SEÇİLDİĞİNDE ŞUBE */}
            {role === 'teacher' && (
              <SelectField
                label="Şube"
                value={branchId}
                onChange={setBranchId}
                placeholder="-- Şube seç --"
                className="min-w-[200px]"
                options={branches.map((branch) => ({
                  value: String(branch.id),
                  label: branch.name,
                }))}
              />
            )}

            <Button
              color="primary"
              type="submit"
              isLoading={loading}
              className="rounded-xl font-medium"
            >
              Kullanıcı Oluştur
            </Button>

          </div>
        </form>
      </div>

      {/* ==================================================
          ERİŞİM DİZİNİ
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">

        <div className="p-6 pb-4 flex items-center justify-between">

          <div>
            <h2 className="font-semibold text-slate-700">
              Erişim Dizini
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Kayıtlı hesapların yetki seviyesini ayarla
            </p>
          </div>

          <ShieldCheck
            size={18}
            className="text-blue-500"
          />

        </div>

        {fetching ? (
          <div className="p-6">
            <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
          </div>
        ) : (
          <table className="w-full text-sm">

            <thead>
              <tr className="border-t border-slate-50">

                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">
                  KULLANICI
                </th>

                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">
                  EMAIL
                </th>

                <th className="text-left px-6 py-3 text-[11px] tracking-wider font-semibold text-slate-400">
                  ERİŞİM SEVİYESİ
                </th>

              </tr>
            </thead>

            <tbody>

              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors duration-150"
                >

                  <td className="px-6 py-4 font-medium text-slate-700">
                    {p.full_name}
                  </td>

                  <td className="px-6 py-4 text-slate-400">
                    {p.email}
                  </td>

                  <td className="px-6 py-4">

                    <SelectField
                      value={p.role}
                      onChange={(newRole) =>
                        handleRoleChange(
                          p.id,
                          newRole
                        )
                      }
                      className="min-w-[130px]"
                      options={[
                        {
                          value: 'admin',
                          label: 'Admin',
                        },
                        {
                          value: 'editor',
                          label: 'Editor',
                        },
                        {
                          value: 'teacher',
                          label: 'Öğretmen',
                        },
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