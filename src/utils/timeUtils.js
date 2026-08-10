export const DAYS = [
  { value: 1, label: 'Pazartesi', key: 'monday_hours' },
  { value: 2, label: 'Salı', key: 'tuesday_hours' },
  { value: 3, label: 'Çarşamba', key: 'wednesday_hours' },
  { value: 4, label: 'Perşembe', key: 'thursday_hours' },
  { value: 5, label: 'Cuma', key: 'friday_hours' },
]

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Verilen ayarlara göre, bir gün için ders saatlerini (period listesi) hesaplar
export function computeDayPeriods(settings, dayHours) {
  const periods = []
  let currentStart = settings.lesson_start.slice(0, 5) // "08:30:00" -> "08:30"

  for (let i = 1; i <= dayHours; i++) {
    const end = addMinutes(currentStart, settings.lesson_duration)
    periods.push({ periodNumber: i, start: currentStart, end })

    const breakLength =
      i === settings.lunch_after_period ? settings.lunch_duration : settings.break_duration
    currentStart = addMinutes(end, breakLength)
  }

  return periods
}

// Tüm hafta için (her gün kendi period listesiyle) hesaplar
export function computeWeekPeriods(settings) {
  const week = {}
  DAYS.forEach((day) => {
    week[day.value] = computeDayPeriods(settings, settings[day.key])
  })
  return week
}

// "2+3" -> [2, 3]  |  "4" -> [4]  |  "" / null / geçersiz -> []
export function parseBlockPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return []
  const parts = pattern
    .split('+')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => Number(p))

  if (parts.length === 0 || parts.some((n) => !Number.isInteger(n) || n <= 0)) {
    return []
  }
  return parts
}

// Bir atama (assignment) için, mevcut schedule kayıtlarına bakarak
// hangi blokların yerleştirildiğini, hangilerinin bekleneceğini hesaplar.
// scheduleEntries: bu assignment'a ait kayıtlar (time_slot bilgisiyle zenginleştirilmiş: day_of_week, period_number)
export function computeBlockState(blockPattern, scheduleEntries) {
  const parts = parseBlockPattern(blockPattern)

  // Blok yapısı tanımlı değilse: her saat tek tek (1'lik bloklar) yerleştirilir.
  if (parts.length === 0) {
    return { hasPattern: false, remainingBlocks: [], placedRuns: [] }
  }

  // Aynı gün + ardışık period_number'a sahip kayıtları "run" (blok) olarak grupla
  const byDay = {}
  scheduleEntries.forEach((entry) => {
    const day = entry.day_of_week
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(entry)
  })

  const runs = []
  Object.values(byDay).forEach((dayEntries) => {
    const sorted = [...dayEntries].sort((a, b) => a.period_number - b.period_number)
    let current = null
    sorted.forEach((entry) => {
      if (current && entry.period_number === current.entries[current.entries.length - 1].period_number + 1) {
        current.entries.push(entry)
      } else {
        current = { entries: [entry] }
        runs.push(current)
      }
    })
  })

  // Her run'ın uzunluğunu pattern'deki parçalarla eşleştir (multiset eşleşmesi)
  const remainingParts = [...parts]
  const placedRuns = []
  const extraRuns = []

  runs.forEach((run) => {
    const len = run.entries.length
    const idx = remainingParts.indexOf(len)
    if (idx !== -1) {
      remainingParts.splice(idx, 1)
      placedRuns.push(run.entries)
    } else {
      extraRuns.push(run.entries)
    }
  })

  return {
    hasPattern: true,
    remainingBlocks: remainingParts, // henüz yerleştirilmemiş blok boyutları, örn: [3]
    placedRuns, // her biri time_slot kayıtlarından oluşan diziler
    extraRuns, // pattern ile eşleşmeyen (beklenmeyen) diziler - normalde boş olmalı
  }
}