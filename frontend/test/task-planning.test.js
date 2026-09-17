import assert from 'node:assert/strict'
import test from 'node:test'
import { formatEstimate, getMonthDays, getPriorityTasks, getTasksForDay, isOverdue, parseEstimate } from '../src/task-planning.js'
import { formatSchedule } from '../src/date-time.js'

process.env.TZ = 'America/Los_Angeles'
const task = (id, values = {}) => ({ id, title: `Task ${id}`, status: 'pending', startsAt: null, endsAt: null, ...values })

test('priority uses the earliest deadline, includes overdue tasks, and excludes completed or undated tasks', () => {
  const tasks = [task(1), task(2, { endsAt: '2026-09-20T18:00:00Z' }),
    task(3, { endsAt: '2026-09-16T18:00:00Z' }), task(4, { endsAt: '2026-09-18T18:00:00Z' }),
    task(5, { endsAt: '2026-09-15T18:00:00Z', status: 'completed' }), task(6, { startsAt: '2026-09-17T18:00:00Z' })]
  assert.deepEqual(getPriorityTasks(tasks).map((entry) => entry.id), [3, 4, 2])
  assert.deepEqual(tasks.map((entry) => entry.id), [1, 2, 3, 4, 5, 6])
})

test('priority ties are stable and estimated duration does not change the order', () => {
  const endsAt = '2026-09-20T18:00:00Z'
  assert.deepEqual(getPriorityTasks([task(2, { endsAt, estimatedMinutes: 1 }), task(1, { endsAt, estimatedMinutes: 120 })]).map((entry) => entry.id), [1, 2])
})

test('overdue state changes at the deadline and never marks completed or undated tasks', () => {
  const now = new Date('2026-09-17T18:00:00Z')
  assert.equal(isOverdue(task(1, { endsAt: '2026-09-17T17:59:00Z' }), now), true)
  assert.equal(isOverdue(task(1, { endsAt: now.toISOString() }), now), false)
  assert.equal(isOverdue(task(1), now), false)
  assert.equal(isOverdue(task(1, { endsAt: '2026-09-16T18:00:00Z', status: 'completed' }), now), false)
})

test('estimated time accepts minutes and fractional hours and stays optional', () => {
  assert.equal(parseEstimate('', 'minutes'), null)
  assert.equal(parseEstimate('   ', 'hours'), null)
  assert.equal(parseEstimate('30', 'minutes'), 30)
  assert.equal(parseEstimate('1.5', 'hours'), 90)
  assert.equal(parseEstimate('1.15', 'hours'), 69)
  assert.equal(parseEstimate('168', 'hours'), 10080)
  assert.equal(formatEstimate(30), '30 min')
  assert.equal(formatEstimate(60), '1 hr')
  assert.equal(formatEstimate(90), '1 hr 30 min')
})

test('estimated time rejects invalid, nonpositive, fractional-minute, and excessive values', () => {
  for (const value of ['0', '-1', '0.5', '10081', '1e2', 'abc', 'Infinity']) assert.equal(parseEstimate(value, 'minutes'), undefined)
  assert.equal(parseEstimate('169', 'hours'), undefined)
  assert.equal(parseEstimate('1.01', 'hours'), undefined)
})

test('calendar places deadline-only and start-only tasks on their local day', () => {
  const tasks = [task(1, { endsAt: '2026-09-18T01:00:00Z' }), task(2, { startsAt: '2026-09-17T16:00:00Z' }), task(3)]
  assert.deepEqual(getTasksForDay(tasks, new Date(2026, 8, 17)).map((entry) => entry.id), [2, 1])
  assert.deepEqual(getTasksForDay(tasks, new Date(2026, 8, 18)), [])
})

test('calendar includes multi-day ranges and excludes the day after a midnight end', () => {
  const tasks = [task(1, { startsAt: '2026-09-17T16:00:00Z', endsAt: '2026-09-19T07:00:00Z' })]
  assert.equal(getTasksForDay(tasks, new Date(2026, 8, 17)).length, 1)
  assert.equal(getTasksForDay(tasks, new Date(2026, 8, 18)).length, 1)
  assert.equal(getTasksForDay(tasks, new Date(2026, 8, 19)).length, 0)
})

test('calendar uses local day boundaries through daylight-saving changes', () => {
  const tasks = [task(1, { endsAt: '2026-03-09T06:59:00Z' }), task(2, { endsAt: '2026-03-09T07:00:00Z' })]
  assert.deepEqual(getTasksForDay(tasks, new Date(2026, 2, 8)).map((entry) => entry.id), [1])
  assert.deepEqual(getTasksForDay(tasks, new Date(2026, 2, 9)).map((entry) => entry.id), [2])
})

test('month cells cover whole weeks, year boundaries, and leap days', () => {
  const january = getMonthDays(new Date(2027, 0, 1))
  assert.equal(january[0].getDay(), 0)
  assert.equal(january[0].getFullYear(), 2026)
  assert.equal(january.at(-1).getDay(), 6)
  assert.equal(january.length % 7, 0)
  assert.ok(getMonthDays(new Date(2028, 1, 1)).some((day) => day.getMonth() === 1 && day.getDate() === 29))
})

test('deadline-only display is English and never invents a start date', () => {
  assert.match(formatSchedule(null, '2026-09-20T18:00:00Z'), /^Due Sep 20, 2026 at /)
  assert.equal(formatSchedule(null, null), '')
})
