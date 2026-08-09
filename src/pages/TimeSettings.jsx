import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'
import { syncTimeSlots } from '../utils/syncTimeSlots'
import { DAYS } from '../utils/timeUtils'

export default function TimeSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setFetching(true)
    const { data, error } = await supabase
      .from('time_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) console.error(error)
    else setSettings(data)
    setFetching(false)
  }

  function updateField(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    const confirmMsg =
      'Kaydedersen tum haftalik program saatleri yeniden hesaplanacak. Eger bir gunu kisaltirsan, o gune ait fazla saatlerdeki dersler programdan silinecek. Devam edilsin mi?'
    if (!confirm(confirmMsg)) return

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

      alert('Ayarlar kaydedildi ve program saatleri guncellendi.')
    } catch (err) {
      alert('Hata: ' + err.message)
    }
    setLoading(false)
  }

  if (fetching || !settings) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="h-8 w-56 bg-slate-100 rounded-lg animate-pulse mb-6"></div>
        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse mb-4"></div>
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Zaman Parametreleri</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ders saatlerini ve teneffus surelerini ayarla. Bu degisiklik tum okulun programini etkiler.
        </p>
      </div>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-4">
        <h2 className="font-semibold text-sm text-slate-600 mb-4">Ders Zaman Ayarlari</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ders Baslangic Saati</label>
            <Input
              type="time"
              value={settings.lesson_start?.slice(0, 5)}
              onChange={(e) => updateField('lesson_start', e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ders Suresi (dk)</label>
            <Input
              type="number"
              placeholder="orn: 40"
              value={settings.lesson_duration}
              onChange={(e) => updateField('lesson_duration', e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Teneffus Suresi (dk)</label>
            <Input
              type="number"
              placeholder="orn: 10"
              value={settings.break_duration}
              onChange={(e) => updateField('break_duration', e.target.value)}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ogle Arasi Suresi (dk)</label>
            <Input
              type="number"
              placeholder="orn: 45"
              value={settings.lunch_duration}
              onChange={(e) => updateField('lunch_duration', e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Ogle Arasi Kacinci Dersten Sonra</label>
            <Input
              type="number"
              placeholder="orn: 5"
              value={settings.lunch_after_period}
              onChange={(e) => updateField('lunch_after_period', e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 border-0 shadow-soft rounded-2xl mb-4">
        <h2 className="font-semibold text-sm text-slate-600 mb-4">Gunluk Ders Saati Sayisi</h2>
        <div className="flex gap-3 flex-wrap">
          {DAYS.map((day) => (
            <div key={day.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">{day.label}</label>
              <Input
                type="number"
                placeholder="orn: 8"
                value={settings[day.key]}
                onChange={(e) => updateField(day.key, e.target.value)}
                className="w-24"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={loading}
          className="rounded-xl font-medium"
        >
          Kaydet
        </Button>
      </div>
    </div>
  )
}