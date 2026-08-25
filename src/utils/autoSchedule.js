import { parseBlockPattern } from './timeUtils'

// Diziyi rastgele karıştırır (her çalıştırmada farklı bir dağılım denesin diye)
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Bir öğretmenin belirli bir slot'ta müsait olup olmadığını kontrol eder
function isTeacherFree(teacherId, slot, teacherBusyMap, constraints) {
  const key = teacherId + '-' + slot.id
  if (teacherBusyMap.has(key)) return false

  const isConstrained = constraints.some((c) => {
    if (String(c.teacher_id) !== String(teacherId)) return false
    if (c.day_of_week !== slot.day_of_week) return false
    const cStart = c.start_time.slice(0, 5)
    const cEnd = c.end_time.slice(0, 5)
    const slotStart = slot.start_time.slice(0, 5)
    return slotStart >= cStart && slotStart < cEnd
  })
  return !isConstrained
}

// Verilen gündeki period_number'dan başlayarak `size` kadar ardışık boş slot bulur
function findConsecutiveSlots(day, startPeriod, size, timeSlotsByDay, branchBusySet, teacherId, teacherBusyMap, constraints) {
  const daySlots = timeSlotsByDay[day] || []
  const slots = []
  for (let p = startPeriod; p < startPeriod + size; p++) {
    const slot = daySlots.find((s) => s.period_number === p)
    if (!slot) return null
    if (branchBusySet.has(slot.id)) return null
    if (!isTeacherFree(teacherId, slot, teacherBusyMap, constraints)) return null
    slots.push(slot)
  }
  return slots
}

/**
 * assignments: bu subeye ait course_assignments listesi (weekly_hours, block_pattern, teacher_id iceriyor)
 * timeSlots: tum time_slots listesi
 * branchExistingEntries: bu subenin zaten dolu olan schedules kayitlari (time_slot_id listesi)
 * teacherBusyEntries: ilgili ogretmenlerin TUM subelerdeki mevcut kayitlari [{teacher_id, time_slot_id}]
 * constraints: teacher_constraints tablosu
 * days: [{value, label}]
 */
export function generateAutoSchedule({ assignments, timeSlots, branchExistingEntries, teacherBusyEntries, constraints, days }) {
  const timeSlotsByDay = {}
  days.forEach((d) => {
    timeSlotsByDay[d.value] = timeSlots.filter((s) => s.day_of_week === d.value).sort((a, b) => a.period_number - b.period_number)
  })

  const branchBusySet = new Set(branchExistingEntries.map((e) => e.time_slot_id))
  const teacherBusyMap = new Map()
  teacherBusyEntries.forEach((e) => teacherBusyMap.set(e.teacher_id + '-' + e.time_slot_id, true))

  const placements = []
  const unplaced = []

  // Once blok yapisi zorunlu (buyuk) atamalari, sonra tekli saatleri yerlestirmek
  // basari oranini artirir; buyukten kucuge sirala.
  const sortedAssignments = [...assignments].sort((a, b) => (b.weekly_hours || 0) - (a.weekly_hours || 0))

  for (const assignment of sortedAssignments) {
    const alreadyPlaced = branchExistingEntries.filter((e) => String(e.assignment_id) === String(assignment.id)).length
    const remainingHours = assignment.weekly_hours - alreadyPlaced
    if (remainingHours <= 0) continue

    const pattern = parseBlockPattern(assignment.block_pattern)
    const blocks = pattern.length > 0 ? [...pattern] : Array(remainingHours).fill(1)

    for (const blockSize of blocks) {
      let placed = false
      const shuffledDays = shuffle(days)

      for (const day of shuffledDays) {
        const daySlots = timeSlotsByDay[day.value] || []
        const startPeriods = shuffle(daySlots.map((s) => s.period_number))

        for (const startPeriod of startPeriods) {
          const found = findConsecutiveSlots(
            day.value, startPeriod, blockSize, timeSlotsByDay,
            branchBusySet, assignment.teacher_id, teacherBusyMap, constraints
          )
          if (found) {
            found.forEach((slot) => {
              branchBusySet.add(slot.id)
              teacherBusyMap.set(assignment.teacher_id + '-' + slot.id, true)
              placements.push({
                assignment_id: assignment.id,
                time_slot_id: slot.id,
              })
            })
            placed = true
            break
          }
        }
        if (placed) break
      }

      if (!placed) {
        unplaced.push({ assignment, blockSize })
      }
    }
  }

  return { placements, unplaced }
}