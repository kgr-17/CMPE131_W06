import { englishDate, formatSchedule } from './date-time.js'
import { formatEstimate, isOverdue } from './task-planning.js'

export default function TaskList({ tasks, ranked = false, now }) {
  return (
    <ul className={`task-list panel${ranked ? ' priority-list' : ''}`}>
      {tasks.map((task, index) => (
        <li className="task-item" key={task.id}>
          {ranked ? <span className="priority-rank" aria-label={`Priority ${index + 1}`}>{index + 1}</span>
            : <span className="task-bullet" aria-hidden="true" />}
          <div className="task-content">
            <h3>{task.title}</h3>
            {task.description && <p className="task-description">{task.description}</p>}
            {(task.startsAt || task.endsAt || task.location || task.estimatedMinutes) && (
              <dl className="task-details">
                {(task.startsAt || task.endsAt) && <div><dt>When</dt><dd>{formatSchedule(task.startsAt, task.endsAt)}</dd></div>}
                {task.estimatedMinutes && <div><dt>Estimate</dt><dd>{formatEstimate(task.estimatedMinutes)}</dd></div>}
                {task.location && <div><dt>Where</dt><dd>{task.location}</dd></div>}
              </dl>
            )}
            <div className="task-meta">
              <span className={`status-label${isOverdue(task, now) ? ' overdue-label' : ''}`}>
                {isOverdue(task, now) ? 'Overdue' : task.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Added <time dateTime={task.createdAt}>{englishDate.format(new Date(task.createdAt))}</time></span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
