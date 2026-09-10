import { useEffect, useRef, useState } from 'react'
import DateTimeField from './DateTimeField.jsx'
import { englishDate, formatDateInput, formatSchedule, toUtcTimestamp } from './date-time.js'

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const localTimeZone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'longGeneric' })
  .formatToParts(new Date()).find((part) => part.type === 'timeZoneName').value

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [scheduled, setScheduled] = useState(false)
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

    const startsAt = scheduled ? toUtcTimestamp(startDate, startTime) : null
    const endsAt = scheduled ? toUtcTimestamp(endDate, endTime) : null
    if (scheduled && (!startsAt || !endsAt)) {
      setFormError('Enter valid dates as MM/DD/YYYY and times as HH:MM (24-hour time).')
      return
    }
    if (scheduled && endsAt <= startsAt) {
      setFormError('The end time must be after the start time.')
      return
    }

    submitting.current = true
    setSaving(true)
    try {
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), location: location.trim(), startsAt, endsAt }),
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
          <span className="header-note">A little less on your mind.</span>
        </div>
      </header>

      <main id="main" className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">LESS MENTAL CLUTTER. MORE CLARITY.</p>
          <h1 id="page-title">Big plans.<br /><span>Small first steps.</span></h1>
          <p className="intro-copy">A simple place for everything you need to do.<br className="desktop-break" /> Write it down. Make a little room for what matters.</p>
        </section>

        <div className="workspace-grid">
          <section className="composer panel" aria-labelledby="form-heading">
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
                <div className="schedule-section">
                  <label className="schedule-toggle" htmlFor="task-scheduled">
                    <span><span className="schedule-toggle-title">Date &amp; time</span><span className="schedule-toggle-hint">Make a little time for it.</span></span>
                    <input id="task-scheduled" type="checkbox" role="switch" checked={scheduled}
                      onChange={(event) => { setScheduled(event.target.checked); setFormError(''); setSuccess('') }} />
                    <span className="switch-track" aria-hidden="true" />
                  </label>
                  {scheduled && <div className="schedule-fields">
                    <DateTimeField id="task-start" label="Starts" date={startDate} time={startTime}
                      onDateChange={setStartDate} onTimeChange={setStartTime} />
                    <DateTimeField id="task-end" label="Ends" date={endDate} time={endTime}
                      onDateChange={setEndDate} onTimeChange={setEndTime} />
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

          <section className="task-section" aria-labelledby="tasks-heading" aria-busy={loading}>
            <div className="task-section-header">
              <div className="task-heading-group">
                <h2 id="tasks-heading">Your tasks</h2>
                {!loading && !loadError && <span className="task-count" aria-label={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}>{tasks.length}</span>}
              </div>
              <span className="list-caption">{tasks.length > 0 ? 'Newest first' : 'A little space to start'}</span>
            </div>
            {loading ? (
              <div className="empty-state panel" role="status"><span className="spinner loading-spinner" aria-hidden="true" /><p>Getting your tasks…</p></div>
            ) : loadError ? (
              <div className="empty-state panel">
                <h3>Let’s try that again.</h3>
                <p role="alert">We couldn’t load your tasks.<br />Check your connection and try again.</p>
                <button className="retry-button" type="button" disabled={saving} onClick={() => setReload((value) => value + 1)}>Try again</button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state panel">
                <div className="empty-art" aria-hidden="true">
                  <div className="paper paper-back" />
                  <div className="paper paper-front"><span className="paper-check" /><span className="paper-line" /><span className="paper-line short" /></div>
                  <span className="art-spark">+</span>
                </div>
                <h3>A fresh start.</h3>
                <p>Your next small step belongs here.<br />Add your first task to get going.</p>
              </div>
            ) : (
              <ul className="task-list panel">
                {tasks.map((task) => (
                  <li className="task-item" key={task.id}>
                    <span className="task-bullet" aria-hidden="true" />
                    <div className="task-content">
                      <h3>{task.title}</h3>
                      {task.description && <p className="task-description">{task.description}</p>}
                      {(task.startsAt || task.location) && <dl className="task-details">
                        {task.startsAt && <div><dt>When</dt><dd><time dateTime={task.startsAt}>{formatSchedule(task.startsAt, task.endsAt)}</time></dd></div>}
                        {task.location && <div><dt>Where</dt><dd>{task.location}</dd></div>}
                      </dl>}
                      <div className="task-meta"><span className="status-label">{task.status === 'completed' ? 'Completed' : 'Pending'}</span><span aria-hidden="true">·</span><span>Added <time dateTime={task.createdAt}>{englishDate.format(new Date(task.createdAt))}</time></span></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="list-footer">A place for your tasks. Space for your day.</p>
          </section>
        </div>
      </main>
      <footer className="site-footer"><span>Dynamic Task Manager</span><span>Keep it simple. Keep moving.</span></footer>
    </div>
  )
}

export default App
