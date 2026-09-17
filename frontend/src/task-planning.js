// The current priority rule uses deadlines only. Estimates do not affect order.
export function getPriorityTasks(tasks) {
  return tasks.filter((task) => task.status === 'pending' && task.endsAt)
    .sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt) || a.id - b.id)
}

export function isOverdue(task, now = new Date()) {
  return task.status === 'pending' && Boolean(task.endsAt) && new Date(task.endsAt) < now
}

export function parseEstimate(value, unit) {
  if (!value.trim()) return null
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return undefined
  const minutes = Math.round(Number(value) * 100) * (unit === 'hours' ? 60 : 1) / 100
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 10080 ? minutes : undefined
}

export function formatEstimate(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return [hours ? `${hours} hr` : '', remainder ? `${remainder} min` : ''].filter(Boolean).join(' ')
}

export function getTasksForDay(tasks, day) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  return tasks.filter((task) => {
    if (task.startsAt && task.endsAt) {
      // A range ending exactly at midnight does not occupy the following day.
      return new Date(task.startsAt) < dayEnd && new Date(task.endsAt) > dayStart
    }
    const timestamp = task.endsAt || task.startsAt
    return timestamp && new Date(timestamp) >= dayStart && new Date(timestamp) < dayEnd
  }).sort((a, b) => new Date(a.startsAt || a.endsAt) - new Date(b.startsAt || b.endsAt) || a.id - b.id)
}

export function getMonthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((first.getDay() + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) =>
    new Date(first.getFullYear(), first.getMonth(), index - first.getDay() + 1))
}
