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
            'Kaydedersen tüm haftalık program saatleri yeniden hesaplanacak. Eğer bir günü kısaltırsan, o güne ait fazla saatlerdeki dersler programdan silinecek. Devam edilsin mi?'
        if (!confirm(confirmMsg)) return

        setLoading(true)
        try {
            // 1. Ayarları kaydet
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

            // 2. time_slots tablosunu yeni ayarlara göre senkronize et
            await syncTimeSlots(settings)

            alert('Ayarlar kaydedildi ve program saatleri güncellendi.')
        } catch (err) {
            alert('Hata: ' + err.message)
        }
        setLoading(false)
    }

    if (fetching || !settings) {
        return <div className="p-6">Yükleniyor...</div>
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">Zaman Parametreleri</h1>
            <p className="text-gray-500 text-sm mb-4">
                Ders saatlerini ve teneffüs sürelerini ayarla. Bu değişiklik tüm okulun haftalık programını etkiler.
            </p>

            <Card className="p-4 mb-4 flex flex-col gap-3">
                <h2 className="font-semibold text-sm text-gray-600">Ders Zaman Ayarları</h2>
                <div className="flex gap-3 flex-wrap">
                    <div>
                        <label className="text-sm font-medium block mb-1">Ders Başlangıç Saati</label>
                        <Input
                            type="time"
                            value={settings.lesson_start?.slice(0, 5)}
                            onChange={(e) => updateField('lesson_start', e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Ders Süresi (dakika)</label>
                        <Input
                            type="number"
                            placeholder="örn: 40"
                            value={settings.lesson_duration}
                            onChange={(e) => updateField('lesson_duration', e.target.value)}
                            className="w-32"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Teneffüs Süresi (dakika)</label>
                        <Input
                            type="number"
                            placeholder="örn: 10"
                            value={settings.break_duration}
                            onChange={(e) => updateField('break_duration', e.target.value)}
                            className="w-32"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Öğle Arası Süresi (dakika)</label>
                        <Input
                            type="number"
                            placeholder="örn: 45"
                            value={settings.lunch_duration}
                            onChange={(e) => updateField('lunch_duration', e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Öğle Arası Kaçıncı Dersten Sonra</label>
                        <Input
                            type="number"
                            placeholder="örn: 5"
                            value={settings.lunch_after_period}
                            onChange={(e) => updateField('lunch_after_period', e.target.value)}
                            className="w-48"
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-4 mb-4 flex flex-col gap-3">
                <h2 className="font-semibold text-sm text-gray-600">Günlük Ders Saati Sayısı</h2>
                <div className="flex gap-3 flex-wrap">
                    {DAYS.map((day) => (
                        <div key={day.key}>
                            <label className="text-sm font-medium block mb-1">{day.label}</label>
                            <Input
                                type="number"
                                placeholder="örn: 8"
                                value={settings[day.key]}
                                onChange={(e) => updateField(day.key, e.target.value)}
                                className="w-28"
                            />
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <Button color="primary" onClick={handleSave} isLoading={loading}>
                    Kaydet
                </Button>
            </div>
        </div>
    )
}