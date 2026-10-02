import { parseBlockPattern } from './timeUtils'

function key(teacherId, slotId) {
  return String(teacherId) + '-' + String(slotId)
}

function isTeacherFree(teacherId, slot, teacherBusySet, constraints) {
  if (teacherBusySet.has(key(teacherId, slot.id))) return false
  return !constraints.some((constraint) => {
    if (String(constraint.teacher_id) !== String(teacherId)) return false
    if (Number(constraint.day_of_week) !== Number(slot.day_of_week)) return false
    const start = constraint.start_time.slice(0, 5)
    const end = constraint.end_time.slice(0, 5)
    const slotStart = slot.start_time.slice(0, 5)
    return slotStart >= start && slotStart < end
  })
}

function consecutiveSlots(daySlots, startPeriod, size) {
  const slots = []
  for (let period = startPeriod; period < startPeriod + size; period += 1) {
    const slot = daySlots.find((candidate) => candidate.period_number === period)
    if (!slot) return null
    slots.push(slot)
  }
  return slots
}

function existingRuns(assignment, branchExistingEntries, slotById) {
  const entries = branchExistingEntries
    .filter((entry) => String(entry.assignment_id) === String(assignment.id))
    .map((entry) => slotById.get(String(entry.time_slot_id)))
    .filter(Boolean)
    .sort((a, b) => a.day_of_week - b.day_of_week || a.period_number - b.period_number)

  const runs = []
  entries.forEach((slot) => {
    const previous = runs[runs.length - 1]
    if (previous && previous[previous.length - 1].day_of_week === slot.day_of_week && previous[previous.length - 1].period_number + 1 === slot.period_number) {
      previous.push(slot)
    } else {
      runs.push([slot])
    }
  })
  return runs
}

function remainingBlocks(assignment, branchExistingEntries, slotById) {
  const weeklyHours = Math.max(0, Number(assignment.weekly_hours) || 0)
  const pattern = parseBlockPattern(assignment.block_pattern)
  const existing = existingRuns(assignment, branchExistingEntries, slotById)
  const placedHours = existing.reduce((sum, run) => sum + run.length, 0)
  let blocks = pattern.length > 0 && pattern.reduce((sum, size) => sum + size, 0) <= weeklyHours
    ? [...pattern]
    : Array(weeklyHours).fill(1)

  // Match existing contiguous runs to the configured block pattern before generating the remainder.
  existing.forEach((run) => {
    const index = blocks.indexOf(run.length)
    if (index >= 0) blocks.splice(index, 1)
  })

  const remainingHours = Math.max(0, weeklyHours - placedHours)
  while (blocks.reduce((sum, size) => sum + size, 0) > remainingHours) {
    blocks.pop()
  }
  while (blocks.reduce((sum, size) => sum + size, 0) < remainingHours) blocks.push(1)
  return blocks.sort((a, b) => b - a)
}

function getCandidates({ blockSize, assignment, timeSlotsByDay, branchBusySet, teacherBusySet, constraints, dayLoad }) {
  const candidates = []
  Object.entries(timeSlotsByDay).forEach(([day, daySlots]) => {
    daySlots.forEach((slot) => {
      const slots = consecutiveSlots(daySlots, slot.period_number, blockSize)
      if (!slots || slots.some((candidate) => branchBusySet.has(String(candidate.id)))) return
      if (slots.some((candidate) => !isTeacherFree(assignment.teacher_id, candidate, teacherBusySet, constraints))) return
      const load = dayLoad.get(`${assignment.id}-${day}`) || 0
      const teacherDayLoad = dayLoad.get(`teacher-${assignment.teacher_id}-${day}`) || 0
      candidates.push({
        slots,
        score: load * 100 + teacherDayLoad * 10 + Number(day) * 0.1 + slot.period_number * 0.01,
      })
    })
  })
  return candidates.sort((a, b) => a.score - b.score)
}

/**
 * Places all remaining blocks where possible. The search is deterministic and
 * keeps the most constrained/largest blocks first so it does not waste small
 * slots before placing a two- or three-period block.
 */
export function generateAutoSchedule({ assignments, timeSlots, branchExistingEntries, teacherBusyEntries, constraints, days }) {
  const timeSlotsByDay = {}
  days.forEach((day) => {
    timeSlotsByDay[day.value] = timeSlots
      .filter((slot) => Number(slot.day_of_week) === Number(day.value))
      .sort((a, b) => a.period_number - b.period_number)
  })

  const slotById = new Map(timeSlots.map((slot) => [String(slot.id), slot]))
  const branchBusySet = new Set(branchExistingEntries.map((entry) => String(entry.time_slot_id)))
  const teacherBusySet = new Set(teacherBusyEntries.map((entry) => key(entry.teacher_id, entry.time_slot_id)))
  const dayLoad = new Map()
  const blocks = []

  assignments.forEach((assignment) => {
    remainingBlocks(assignment, branchExistingEntries, slotById).forEach((size, index) => {
      blocks.push({ assignment, size, index })
    })
  })

  blocks.sort((a, b) => b.size - a.size || Number(a.assignment.weekly_hours) - Number(b.assignment.weekly_hours))
  const placements = []
  const unplaced = []

  blocks.forEach(({ assignment, size, index }) => {
    const candidates = getCandidates({
      blockSize: size,
      assignment,
      timeSlotsByDay,
      branchBusySet,
      teacherBusySet,
      constraints,
      dayLoad,
    })

    const chosen = candidates[0]
    if (!chosen) {
      unplaced.push({ assignment, blockSize: size, blockIndex: index })
      return
    }

    chosen.slots.forEach((slot) => {
      branchBusySet.add(String(slot.id))
      teacherBusySet.add(key(assignment.teacher_id, slot.id))
      placements.push({ assignment_id: assignment.id, time_slot_id: slot.id })
      const dayKey = `${assignment.id}-${slot.day_of_week}`
      dayLoad.set(dayKey, (dayLoad.get(dayKey) || 0) + 1)
      const teacherKey = `teacher-${assignment.teacher_id}-${slot.day_of_week}`
      dayLoad.set(teacherKey, (dayLoad.get(teacherKey) || 0) + 1)
    })
  })

  return { placements, unplaced }
}
