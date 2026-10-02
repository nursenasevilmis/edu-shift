import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { syncTimeSlots } from '../utils/syncTimeSlots'
import { DAYS } from '../utils/timeUtils'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'

export default function TimeSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()
  const confirmDialog = useConfirm()

  const fetchSettings = useCallback(async () => {
    setFetching(true)
    const { data, error } = await supabase.from('time_settings').select('*').eq('id', 1).single()
    if (error) toast.error('Zaman ayarları alınamadı: ' + error.message)
    else setSettings(data)
    setFetching(false)
  }, [toast])

  useEffect(() => { void Promise.resolve().then(fetchSettings) }, [fetchSettings])

  function updateField(field, value) { setSettings((previous) => ({ ...previous, [field]: value })) }

  async function handleSave() {
    const ok = await confirmDialog({ title: 'Zaman ayarlarını güncelle', message: 'Bu işlem haftalık programdaki tüm saat slotlarını yeniden hesaplar. Mevcut ders yerleşimleri tekrar kontrol edilmelidir. Devam edilsin mi?', confirmLabel: 'Saatleri güncelle' })
    if (!ok) return
    setLoading(true)
    try {
      const values = {
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
      }
      const { error } = await supabase.from('time_settings').update(values).eq('id', 1)
      if (error) throw error
      await syncTimeSlots({ ...settings, ...values })
      toast.success('Zaman ayarları kaydedildi ve saat gridleri güncellendi.')
    } catch (error) { toast.error('Ayarlar kaydedilemedi: ' + error.message) }
    setLoading(false)
  }

  if (fetching || !settings) return <div className="page-canvas"><div className="page-width settings-loading"><div /><div /><div /></div></div>

  const totalHours = DAYS.reduce((sum, day) => sum + Number(settings[day.key] || 0), 0)
  return (
    <div className="page-canvas settings-page">
      <div className="page-width settings-page-width">
        <PageHeader title="Zaman ayarları" subtitle="Okul gününün saat düzenini ve haftalık kapasitesini yönet" eyebrow="Yönetim / çalışma düzeni" action={<button type="button" className="primary-button" onClick={handleSave} disabled={loading}>{loading ? 'Güncelleniyor...' : 'Ayarları kaydet'}</button>} />
        <div className="settings-overview"><div><span>İlk ders</span><strong>{settings.lesson_start?.slice(0, 5)}</strong></div><div><span>Ders süresi</span><strong>{settings.lesson_duration} dk</strong></div><div><span>Haftalık kapasite</span><strong>{totalHours} saat</strong></div><div><span>Öğle arası</span><strong>{settings.lunch_duration} dk</strong></div></div>
        <div className="settings-layout">
          <PageCard title="Günün ritmi" description="Her ders slotu bu temel zaman kurallarına göre üretilir.">
            <div className="settings-form-grid">
              <label>İlk ders başlangıcı<input type="time" value={settings.lesson_start?.slice(0, 5)} onChange={(event) => updateField('lesson_start', event.target.value)} /></label>
              <label>Ders süresi<input type="number" min="1" value={settings.lesson_duration} onChange={(event) => updateField('lesson_duration', event.target.value)} /><small>dakika</small></label>
              <label>Kısa teneffüs<input type="number" min="0" value={settings.break_duration} onChange={(event) => updateField('break_duration', event.target.value)} /><small>dakika</small></label>
              <label>Öğle arası<input type="number" min="0" value={settings.lunch_duration} onChange={(event) => updateField('lunch_duration', event.target.value)} /><small>dakika</small></label>
              <label>Öğle arası konumu<input type="number" min="1" value={settings.lunch_after_period} onChange={(event) => updateField('lunch_after_period', event.target.value)} /><small>kaçıncı dersten sonra</small></label>
            </div>
          </PageCard>
          <PageCard title="Haftalık kapasite" description="Her gün için üretilecek maksimum ders slotunu belirle.">
            <div className="capacity-list">{DAYS.map((day) => <label key={day.key}><span><strong>{day.label}</strong><small>{settings.lesson_start?.slice(0, 5)} başlangıç</small></span><input type="number" min="0" max="15" value={settings[day.key]} onChange={(event) => updateField(day.key, event.target.value)} /><em>saat</em></label>)}</div>
          </PageCard>
        </div>
        <div className="settings-warning"><strong>Program etkisi</strong><span>Saat ayarlarını değiştirmek, yeni oluşturulacak gridin slotlarını günceller. Yayınlanmış bir program varsa değişiklikten sonra yerleşimleri kontrol et.</span></div>
      </div>
    </div>
  )
}
