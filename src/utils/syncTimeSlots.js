import { supabase } from '../supabaseClient'
import { computeWeekPeriods, DAYS } from './timeUtils'

// Ayarlara göre hesaplanan periyotları time_slots tablosuyla senkronize eder.
// Her gün için mevcut period_number'lara karşılık gelen satırları günceller,
// fazla period_number'lar varsa (gün kısaldıysa) onları siler.
export async function syncTimeSlots(settings) {
  const week = computeWeekPeriods(settings)

  const { data: existingSlots, error: fetchError } = await supabase
    .from('time_slots')
    .select('*')

  if (fetchError) throw fetchError

  for (const day of DAYS) {
    const dayPeriods = week[day.value]
    const existingForDay = existingSlots.filter((s) => s.day_of_week === day.value)

    // Mevcut period_number'ları güncelle veya yenisini ekle
    for (const p of dayPeriods) {
      const match = existingForDay.find((s) => s.period_number === p.periodNumber)
      if (match) {
        await supabase
          .from('time_slots')
          .update({ start_time: p.start, end_time: p.end })
          .eq('id', match.id)
      } else {
        await supabase.from('time_slots').insert({
          day_of_week: day.value,
          period_number: p.periodNumber,
          start_time: p.start,
          end_time: p.end,
        })
      }
    }

    // Artık kullanılmayan (gün kısaldığı için fazla kalan) period'ları sil
    const toDelete = existingForDay.filter(
      (s) => !dayPeriods.some((p) => p.periodNumber === s.period_number)
    )
    for (const slot of toDelete) {
      await supabase.from('time_slots').delete().eq('id', slot.id)
    }
  }
}