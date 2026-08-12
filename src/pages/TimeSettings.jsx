import { useEffect, useState } from 'react'
import { Button, Input } from '@heroui/react'
import { Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { syncTimeSlots } from '../utils/syncTimeSlots'
import { DAYS } from '../utils/timeUtils'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

export default function TimeSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setFetching(true)
    const { data, error } = await supabase.from('time_settings').select('*').eq('id', 1).single()
    if (error) console.error(error)
    else setSettings(data)
    setFetching(false)
  }

  function updateField(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    const ok = await confirmDialog({
      title: 'Zaman ayarlarını güncelle',
      message: 'Kaydedersen tüm haftalık program saatleri yeniden hesaplanacak. Devam edilsin mi?',
      confirmLabel: 'Kaydet',
    })
    if (!ok) return

    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('time_settings')
        .update({
          lesson_start: settings.lesson_start,
          lesson_duration: Number(settings.lesson_duration),
          break_duration: Number(settings.break_duration),
          lunch_duration: Number(settings.lunch_duration),
          lunch_after_period: Number(settings.lunch_after_period),
          monday_hours: Number(settings.monday_hours),
          tuesday_hours: Number(settings.tuesday_hours),
          wednesday_hours: Number(settings.wednesday_hours),
          thursday_hours: Number(settings.thursday_hours),
          friday_hours: Number(settings.friday_hours),
        })
        .eq('id', 1)

      if (updateError) throw updateError
      await syncTimeSlots(settings)
      toast.success('Ayarlar kaydedildi ve program saatleri güncellendi.')
    } catch (err) {
      toast.error('Hata: ' + err.message)
    }
    setLoading(false)
  }

  if (fetching || !settings) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 w-56 bg-slate-100 rounded-lg animate-pulse mb-6"></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Zaman ve Parametreler</h1>
          <p className="text-slate-400 text-sm mt-1">Okul gününün ritmini ve kapasitesini ayarla</p>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Sistem çalışıyor
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sol: gunun ritmi */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-soft border border-slate-50 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-700">Okul Günü Ritmi</h2>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Clock size={15} className="text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5">Parametreler her program doğrulamasında uygulanır</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">İlk Ders Başlangıcı</label>
              <Input
                type="time"
                value={settings.lesson_start?.slice(0, 5)}
                onChange={(e) => updateField('lesson_start', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Ders Süresi (dakika)</label>
              <Input
                type="number"
                placeholder="örn: 40"
                value={settings.lesson_duration}
                onChange={(e) => updateField('lesson_duration', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Kısa Teneffüs (dakika)</label>
              <Input
                type="number"
                placeholder="örn: 10"
                value={settings.break_duration}
                onChange={(e) => updateField('break_duration', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Öğle Arası (dakika)</label>
              <Input
                type="number"
                placeholder="örn: 45"
                value={settings.lunch_duration}
                onChange={(e) => updateField('lunch_duration', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-medium text-slate-500">Öğle Arası Kaçıncı Dersten Sonra</label>
              <Input
                type="number"
                placeholder="örn: 5"
                value={settings.lunch_after_period}
                onChange={(e) => updateField('lunch_after_period', e.target.value)}
                className="max-w-[200px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-400">Değişiklikler blok yerleştirilmeden önce uygulanır</p>
            <Button color="primary" onClick={handleSave} isLoading={loading} className="rounded-xl font-medium">
              Ritmi Kaydet
            </Button>
          </div>
        </div>

        {/* Sag: gunluk kapasite */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-50 p-6">
          <h2 className="font-semibold text-slate-700 mb-1">Günlük Kapasite</h2>
          <p className="text-xs text-slate-400 mb-5">Her okul günü için maksimum ders saati</p>

          <div className="flex flex-col gap-3">
            {DAYS.map((day) => (
              <div key={day.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-700">{day.label}</p>
                  <p className="text-xs text-slate-400">{settings.lesson_start?.slice(0, 5)} başlangıç</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings[day.key]}
                    onChange={(e) => updateField(day.key, e.target.value)}
                    className="w-16"
                  />
                  <span className="text-xs text-slate-400">saat</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}