import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ teachers: 0, courses: 0, branches: 0, constraints: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const results = await Promise.all([
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase.from('teacher_constraints').select('*', { count: 'exact', head: true }),
    ])

    const teacherResult = results[0]
    const courseResult = results[1]
    const branchResult = results[2]
    const constraintResult = results[3]

    setStats({
      teachers: teacherResult.count || 0,
      courses: courseResult.count || 0,
      branches: branchResult.count || 0,
      constraints: constraintResult.count || 0,
    })
    setLoading(false)
  }

  const cardList = [
    { label: 'Ogretmenler', value: stats.teachers, sub: 'Toplam ogretmen', dotColor: 'bg-blue-500', textColor: 'text-blue-600', ringColor: 'bg-blue-50' },
    { label: 'Dersler', value: stats.courses, sub: 'Toplam ders', dotColor: 'bg-emerald-500', textColor: 'text-emerald-600', ringColor: 'bg-emerald-50' },
    { label: 'Subeler', value: stats.branches, sub: 'Toplam sube', dotColor: 'bg-violet-500', textColor: 'text-violet-600', ringColor: 'bg-violet-50' },
    { label: 'Kisitlar', value: stats.constraints, sub: 'Aktif kisit', dotColor: 'bg-amber-500', textColor: 'text-amber-600', ringColor: 'bg-amber-50' },
  ]

  const linkList = [
    { to: '/schedule', label: 'Program Olusturucuya git' },
    { to: '/constraints', label: 'Ogretmen kisitlarini duzenle' },
    { to: '/assignments', label: 'Yeni ders atamasi yap' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Merhaba, {profile?.full_name}
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">Bugun ne planliyorsun?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cardList.map(function (item) {
          return (
            <Card
              key={item.label}
              className="p-5 border-0 shadow-soft shadow-soft-hover rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
            >
              <div className={'w-11 h-11 rounded-xl ' + item.ringColor + ' flex items-center justify-center mb-4'}>
                <span className={'w-2.5 h-2.5 rounded-full ' + item.dotColor}></span>
              </div>
              {loading ? (
                <div className="h-9 w-12 bg-slate-100 rounded-md animate-pulse mb-1"></div>
              ) : (
                <p className={'text-3xl font-bold ' + item.textColor + ' tabular-nums'}>{item.value}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-soft rounded-2xl">
          <h2 className="font-semibold text-slate-700 mb-1">Hizli Erisim</h2>
          <p className="text-xs text-slate-400 mb-4">Sik kullanilan islemlere goz at</p>
          <div className="flex flex-col gap-1">
            {linkList.map(function (item) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl px-3 py-2.5 -mx-1 transition-colors duration-150"
                >
                  <span className="flex-1">{item.label}</span>
                  <span className="text-slate-300">{'->'}</span>
                </Link>
              )
            })}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-soft rounded-2xl">
          <h2 className="font-semibold text-slate-700 mb-1">Hesap Bilgisi</h2>
          <p className="text-xs text-slate-400 mb-4">Giris yaptigin hesabin ozeti</p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <span className="text-slate-400">Rol</span>
              <span className="font-medium text-slate-700 capitalize bg-slate-50 px-2.5 py-1 rounded-lg text-xs">
                {profile?.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Email</span>
              <span className="font-medium text-slate-700">{profile?.email}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}