export const englishDate = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
})
export const englishTime = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit',
})

export function formatDateInput(date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
}

export function parseDateInput(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null
  const [month, day, year] = value.split('/').map(Number)
  const date = new Date(year, month - 1, day)
  if (year < 1000 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function toUtcTimestamp(dateValue, timeValue) {
  const date = parseDateInput(dateValue)
  if (!date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) return null
  const [hours, minutes] = timeValue.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  // Reject a local time skipped when clocks move forward.
  if (date.getHours() !== hours || date.getMinutes() !== minutes) return null
  return date.toISOString()
}

export function formatSchedule(startsAt, endsAt) {
  const start = new Date(startsAt)
  const startLabel = `${englishDate.format(start)} at ${englishTime.format(start)}`
  if (!endsAt) return startLabel
  const end = new Date(endsAt)
  const endLabel = formatDateInput(start) === formatDateInput(end)
    ? englishTime.format(end)
    : `${englishDate.format(end)} at ${englishTime.format(end)}`
  return `${startLabel} – ${endLabel}`
}
