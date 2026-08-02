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