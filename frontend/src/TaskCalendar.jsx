import { useRef, useState } from 'react'
import TaskList from './TaskList.jsx'
import { formatDateInput } from './date-time.js'
import { getMonthDays, getTasksForDay } from './task-planning.js'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TaskCalendar({ tasks, loading, loadError, now }) {
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const dayButtons = useRef(new Map())
  const selectedTasks = getTasksForDay(tasks, selectedDay)
  const undatedCount = tasks.filter((task) => !task.startsAt && !task.endsAt).length

  function selectDay(day) {
    setSelectedDay(day)
    setMonth(new Date(day.getFullYear(), day.getMonth(), 1))
  }

  function handleDayKey(event, day) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (!(event.key in offsets)) return
    event.preventDefault()
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + offsets[event.key])
    selectDay(next)
    requestAnimationFrame(() => dayButtons.current.get(formatDateInput(next))?.focus())
  }

  return (
    <section id="calendar" className="calendar-section" aria-labelledby="calendar-title" aria-busy={loading}>
      <div className="section-topline">
        <div><p className="eyebrow">SEE THE BIGGER PICTURE</p><h2 id="calendar-title">Your calendar.</h2><p className="section-description">A little perspective on the days ahead.</p></div>
        <span className="section-note">Your local time zone</span>
      </div>
      <div className="month-panel panel">
        <div className="month-toolbar">
          <h3 aria-live="polite">{monthFormatter.format(month)}</h3>
          <div className="month-actions">
            <button type="button" onClick={() => selectDay(new Date())}>Today</button>
            <button type="button" aria-label="Previous calendar month" onClick={() => selectDay(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
            <button type="button" aria-label="Next calendar month" onClick={() => selectDay(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
          </div>
        </div>
        {loadError && <p className="calendar-notice">Tasks could not be loaded. Use Try again in the Priority section.</p>}
        {loading && <p className="calendar-notice" role="status">Loading your calendar tasks…</p>}
        <div className="month-weekdays" aria-hidden="true">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid" role="group" aria-label={monthFormatter.format(month)}>
          {getMonthDays(month).map((day) => {
            const key = formatDateInput(day)
            const dayTasks = loading || loadError ? [] : getTasksForDay(tasks, day)
            const selected = key === formatDateInput(selectedDay)
            const today = key === formatDateInput(now)
            return (
              <button type="button" key={key} ref={(element) => {
                if (element) dayButtons.current.set(key, element)
                else dayButtons.current.delete(key)
              }} className={`month-day${selected ? ' selected-date' : ''}${day.getMonth() !== month.getMonth() ? ' outside-month' : ''}`}
                aria-pressed={selected} aria-current={today ? 'date' : undefined}
                aria-label={`${dayFormatter.format(day)}${loading || loadError ? '' : `, ${dayTasks.length} ${dayTasks.length === 1 ? 'task' : 'tasks'}`}`}
                onClick={() => selectDay(day)} onKeyDown={(event) => handleDayKey(event, day)}>
                <span className={`day-number${today ? ' today-number' : ''}`}>{day.getDate()}</span>
                <span className="day-events" aria-hidden="true">
                  {dayTasks.slice(0, 2).map((task) => <span className="day-event" key={task.id}>{task.title}</span>)}
                  {dayTasks.length > 2 && <span className="more-events">+{dayTasks.length - 2} more</span>}
                </span>
                {dayTasks.length > 0 && <span className="mobile-day-count" aria-hidden="true">{dayTasks.length}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="day-agenda" aria-live="polite">
        <h3>{dayFormatter.format(selectedDay)}</h3>
        {!loading && !loadError && (selectedTasks.length ? <TaskList tasks={selectedTasks} now={now} />
          : <p className="agenda-empty">Nothing scheduled for this day.</p>)}
      </div>
      {!loading && !loadError && undatedCount > 0 && <p className="calendar-footnote">{undatedCount} {undatedCount === 1 ? 'task has' : 'tasks have'} no date yet. Find {undatedCount === 1 ? 'it' : 'them'} in <a href="#all-tasks">All tasks</a>.</p>}
    </section>
  )
}
