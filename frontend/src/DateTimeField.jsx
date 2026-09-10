import { useEffect, useRef, useState } from 'react'
import { formatDateInput, parseDateInput } from './date-time.js'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DateTimeField({ id, label, date, time, onDateChange, onTimeChange }) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => parseDateInput(date) || new Date())
  const container = useRef(null)
  const pickerButton = useRef(null)

  useEffect(() => {
    if (!open) return
    function closeOutside(event) {
      if (!container.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  return (
    <div className="date-time-field" ref={container} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        pickerButton.current?.focus()
      }
    }}>
      <p className="schedule-label">{label}</p>
      <div className="date-time-inputs">
        <div className="date-input-wrap">
          <label className="sr-only" htmlFor={`${id}-date`}>{label} date (MM/DD/YYYY)</label>
          <input id={`${id}-date`} value={date} placeholder="MM/DD/YYYY" maxLength={10}
            onChange={(event) => onDateChange(event.target.value)} autoComplete="off" />
          <button ref={pickerButton} className="calendar-button" type="button" aria-label={`Choose ${label.toLowerCase()} date`}
            aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => {
              if (!open) setMonth(parseDateInput(date) || new Date())
              setOpen(!open)
            }}><span className="calendar-icon" aria-hidden="true" /></button>
        </div>
        <div>
          <label className="sr-only" htmlFor={`${id}-time`}>{label} time (24-hour HH:MM)</label>
          <input id={`${id}-time`} value={time} placeholder="HH:MM" maxLength={5}
            onChange={(event) => onTimeChange(event.target.value)} autoComplete="off" />
        </div>
      </div>
      {open && (
        <div className="calendar-popover" id={`${id}-calendar`} role="group" aria-label={`${label} calendar`}>
          <div className="calendar-heading">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
            <span aria-live="polite">{monthFormatter.format(month)}</span>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="calendar-grid">
            {weekdays.map((day) => <span className="weekday" key={day}>{day}</span>)}
            {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = new Date(month.getFullYear(), month.getMonth(), index + 1)
              const selected = formatDateInput(day) === date
              return <button key={index} type="button" aria-label={dayFormatter.format(day)} aria-pressed={selected}
                className={selected ? 'selected-day' : ''} onClick={() => {
                  onDateChange(formatDateInput(day))
                  setOpen(false)
                  pickerButton.current?.focus()
                }}>{index + 1}</button>
            })}
          </div>
          <button className="calendar-today" type="button" onClick={() => {
            onDateChange(formatDateInput(new Date()))
            setOpen(false)
            pickerButton.current?.focus()
          }}>Today</button>
        </div>
      )}
    </div>
  )
}
