import { useEffect, useRef, useState } from 'react'
import DateTimeField from './DateTimeField.jsx'
import { formatDateInput, toUtcTimestamp } from './date-time.js'
import TaskList from './TaskList.jsx'
import TaskCalendar from './TaskCalendar.jsx'
import { getPriorityTasks, parseEstimate } from './task-planning.js'

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const localTimeZone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'longGeneric' })
  .formatToParts(new Date()).find((part) => part.type === 'timeZoneName').value

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [includeStart, setIncludeStart] = useState(false)
  const [estimate, setEstimate] = useState('')
  const [estimateUnit, setEstimateUnit] = useState('minutes')
  const [startDate, setStartDate] = useState(() => formatDateInput(new Date()))
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState(() => formatDateInput(new Date()))
  const [endTime, setEndTime] = useState('10:00')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)
  const titleInput = useRef(null)
  const submitting = useRef(false)
  const [now, setNow] = useState(() => new Date())
  const priorityTasks = getPriorityTasks(tasks)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (success) titleInput.current?.focus()
  }, [success])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(false)

    async function loadTasks() {
      try {
        const response = await fetch(`${apiUrl}/api/tasks`, { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load tasks')
        setTasks(await response.json())
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadTasks()
    return () => controller.abort()
  }, [reload])

  async function addTask(event) {
    event.preventDefault()
    if (submitting.current) return
    setSuccess('')
    setFormError('')

    if (!title.trim()) {
      setFormError('Give your task a name to get started.')
      titleInput.current?.focus()
      return
    }

    const startsAt = scheduled && includeStart ? toUtcTimestamp(startDate, startTime) : null
    const endsAt = scheduled ? toUtcTimestamp(endDate, endTime) : null
    if (scheduled && (!endsAt || (includeStart && !startsAt))) {
      setFormError('Enter valid dates as MM/DD/YYYY and times as HH:MM (24-hour time).')
      return
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      setFormError('The end time must be after the start time.')
      return
    }
    const estimatedMinutes = parseEstimate(estimate, estimateUnit)
    if (estimatedMinutes === undefined) {
      setFormError('Enter an estimated time from 1 minute to 168 hours, using whole minutes.')
      return
    }

    submitting.current = true
    setSaving(true)
    try {
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), location: location.trim(), startsAt, endsAt, estimatedMinutes }),
      })
      if (!response.ok) {
        throw new Error('We couldn’t save your task. Your text is still here. Please try again.')
      }
      const task = await response.json()
      setTasks((current) => [task, ...current])
      setTitle('')
      setDescription('')
      setLocation('')
      setScheduled(false)
      setIncludeStart(false)
      setEstimate('')
      setEstimateUnit('minutes')
      setSuccess('Task added. One less thing on your mind.')
      if (loadError) setReload((value) => value + 1)
    } catch (error) {
      setFormError(error instanceof TypeError
        ? 'We couldn’t connect. Check your connection and try again. Your text is still here.'
        : error.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Task Manager home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            Task Manager<span className="brand-period">.</span>
          </a>
          <nav className="header-nav" aria-label="Page sections"><a href="#add-task">Add task</a><a href="#priority">Priority</a><a href="#calendar">Calendar</a></nav>
        </div>
      </header>

      <main id="main" className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">LESS MENTAL CLUTTER. MORE CLARITY.</p>
          <h1 id="page-title">Big plans.<br /><span>Small first steps.</span></h1>
          <p className="intro-copy">A simple place for everything you need to do.<br className="desktop-break" /> Write it down. Make a little room for what matters.</p>
        </section>

        <div className="workspace-grid">
          <section id="add-task" className="composer panel" aria-labelledby="form-heading">
            <div className="section-icon" aria-hidden="true">+</div>
            <h2 id="form-heading">One thing at a time.</h2>
            <p className="section-description">Start with a task. The rest can wait.</p>
            <form onSubmit={addTask} aria-busy={saving} noValidate>
              <fieldset disabled={saving}>
                <legend className="sr-only">New task</legend>
                <label htmlFor="task-title">Task name <span className="sr-only">(required)</span></label>
                <input
                  ref={titleInput}
                  id="task-title"
                  name="title"
                  placeholder="What would you like to get done?"
                  value={title}
                  onChange={(event) => { setTitle(event.target.value); setFormError(''); setSuccess('') }}
                  maxLength={200}
                  aria-describedby={formError ? 'task-error' : undefined}
                  required
                />
                <div className="location-field">
                  <label htmlFor="task-location">Location <span className="optional">Optional</span></label>
                  <input id="task-location" name="location" placeholder="Add a place or video call link"
                    value={location} maxLength={500} onChange={(event) => { setLocation(event.target.value); setFormError(''); setSuccess('') }} />
                </div>
                <div className="estimate-field">
                  <label htmlFor="task-estimate">Estimated time <span className="optional">Optional</span></label>
                  <div className="estimate-inputs">
                    <input id="task-estimate" name="estimatedTime" inputMode="decimal" placeholder="e.g. 30" maxLength={8}
                      value={estimate} onChange={(event) => { setEstimate(event.target.value); setFormError(''); setSuccess('') }} />
                    <label className="sr-only" htmlFor="estimate-unit">Estimated time unit</label>
                    <select id="estimate-unit" value={estimateUnit} onChange={(event) => { setEstimateUnit(event.target.value); setFormError('') }}>
                      <option value="minutes">Minutes</option><option value="hours">Hours</option>
                    </select>
                  </div>
                  <p className="field-help">About how long will it take?</p>
                </div>
                <div className="schedule-section">
                  <label className="schedule-toggle" htmlFor="task-scheduled">
                    <span><span className="schedule-toggle-title">Date &amp; time</span><span className="schedule-toggle-hint">Add a deadline. Start time is optional.</span></span>
                    <input id="task-scheduled" type="checkbox" role="switch" checked={scheduled}
                      onChange={(event) => { setScheduled(event.target.checked); setFormError(''); setSuccess('') }} />
                    <span className="switch-track" aria-hidden="true" />
                  </label>
                  {scheduled && <div className="schedule-fields">
                    <DateTimeField id="task-end" label="Ends" date={endDate} time={endTime}
                      onDateChange={(value) => { setEndDate(value); setFormError('') }} onTimeChange={(value) => { setEndTime(value); setFormError('') }} />
                    <label className="start-option" htmlFor="include-start">
                      <input id="include-start" type="checkbox" checked={includeStart}
                        onChange={(event) => { setIncludeStart(event.target.checked); setFormError('') }} />
                      Include a start time <span className="optional">Optional</span>
                    </label>
                    {includeStart && <DateTimeField id="task-start" label="Starts" date={startDate} time={startTime}
                      onDateChange={(value) => { setStartDate(value); setFormError('') }} onTimeChange={(value) => { setStartTime(value); setFormError('') }} />}
                    <p className="schedule-help">MM/DD/YYYY · 24-hour time<br />{localTimeZone}</p>
                  </div>}
                </div>
                <div className="label-row">
                  <label htmlFor="task-description">Notes <span className="optional">Optional</span></label>
                  <span className="character-count" id="description-count">{description.length.toLocaleString('en-US')} / 2,000</span>
                </div>
                <textarea
                  id="task-description"
                  name="description"
                  placeholder="A few details, a little context…"
                  value={description}
                  onChange={(event) => { setDescription(event.target.value); setFormError(''); setSuccess('') }}
                  maxLength={2000}
                  aria-describedby="description-count"
                  rows={4}
                />
                <button className="primary-button" type="submit" disabled={saving || loading}>
                  <span aria-hidden="true" className={saving ? 'spinner' : 'button-plus'}>{saving ? '' : '+'}</span>
                  {saving ? 'Adding task…' : 'Add task'}
                </button>
              </fieldset>
              {formError && <p id="task-error" className="form-message error-message" role="alert">{formError}</p>}
              <p className="form-message success-message" role="status">{success}</p>
            </form>
            <p className="composer-footer"><span className="small-check" aria-hidden="true" /> A small step is still a step forward.</p>
          </section>

          <section id="priority" className="task-section priority-section" aria-labelledby="priority-heading" aria-busy={loading}>
            <div className="priority-heading">
              <p className="eyebrow">FIRST THINGS FIRST</p>
              <div className="task-heading-group"><h2 id="priority-heading">Priority tasks.</h2>
                {!loading && !loadError && <span className="task-count">{priorityTasks.length}</span>}
              </div>
              <p className="section-description">Earliest deadlines first. Overdue tasks stay at the top.</p>
            </div>
            {loading ? (
              <div className="empty-state panel" role="status"><span className="spinner loading-spinner" aria-hidden="true" /><p>Getting your tasks…</p></div>
            ) : loadError ? (
              <div className="empty-state panel">
                <h3>Let’s try that again.</h3>
                <p role="alert">We couldn’t load your tasks.<br />Check your connection and try again.</p>
                <button className="retry-button" type="button" disabled={saving} onClick={() => setReload((value) => value + 1)}>Try again</button>
              </div>
            ) : priorityTasks.length === 0 ? (
              <div className="empty-state panel">
                <div className="empty-art" aria-hidden="true">
                  <div className="paper paper-back" />
                  <div className="paper paper-front"><span className="paper-check" /><span className="paper-line" /><span className="paper-line short" /></div>
                  <span className="art-spark">+</span>
                </div>
                <h3>A little direction.</h3>
                <p>Add an end date and time to a task.<br />Your nearest deadlines will appear here.</p>
              </div>
            ) : <TaskList tasks={priorityTasks} ranked now={now} />}
            <p className="list-footer">One small step, then the next. <a href="#all-tasks">See all tasks</a></p>
          </section>
        </div>

        <TaskCalendar tasks={tasks} loading={loading} loadError={loadError} now={now} />

        <section id="all-tasks" className="all-tasks-section" aria-labelledby="tasks-heading" aria-busy={loading}>
          <div className="task-section-header">
            <div className="task-heading-group"><h2 id="tasks-heading">All tasks</h2>
              {!loading && !loadError && <span className="task-count" aria-label={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}>{tasks.length}</span>}
            </div>
            <span className="list-caption">Newest first</span>
          </div>
          {loading ? <p className="agenda-empty">Loading tasks…</p>
            : loadError ? <p className="agenda-empty">Use Try again in the Priority section to load your tasks.</p>
            : tasks.length ? <TaskList tasks={tasks} now={now} />
            : <p className="agenda-empty panel">Your next small step belongs here. Add your first task to get going.</p>}
        </section>
      </main>
      <footer className="site-footer"><span>Dynamic Task Manager</span><span>Keep it simple. Keep moving.</span></footer>
    </div>
  )
}

export default App
