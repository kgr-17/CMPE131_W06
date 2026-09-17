import assert from 'node:assert/strict'
import test from 'node:test'
import { postTask, startTestServer } from './helpers.js'

test('lists saved tasks', async (t) => {
  const tasks = [{ id: 1, title: 'Finish homework', description: '', status: 'pending' }]
  const url = await startTestServer(t, { list: async () => tasks })
  const response = await fetch(`${url}/api/tasks`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), tasks)
})

test('returns an empty list when there are no tasks', async (t) => {
  const url = await startTestServer(t, { list: async () => [] })
  const response = await fetch(`${url}/api/tasks`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), [])
})

test('returns a generic error when loading tasks fails', async (t) => {
  t.mock.method(console, 'error', () => {})
  const url = await startTestServer(t, {
    list: async () => { throw new Error('Private database details') },
  })
  const response = await fetch(`${url}/api/tasks`)
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Internal server error' })
})

test('creates a task, trims input, and ignores client-supplied metadata', async (t) => {
  const savedTask = {
    id: 1, title: 'Finish homework', description: 'Chapter 3',
    status: 'pending', createdAt: '2026-09-09T12:00:00.000Z',
  }
  const create = t.mock.fn(async (input) => {
    assert.deepEqual(input, { title: 'Finish homework', description: 'Chapter 3', location: '', startsAt: null, endsAt: null, estimatedMinutes: null })
    return savedTask
  })
  const url = await startTestServer(t, { create })
  const response = await postTask(url, {
    title: '  Finish homework  ', description: '  Chapter 3  ',
    id: 99, status: 'completed', createdAt: 'fake date',
  })
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), savedTask)
  assert.equal(create.mock.callCount(), 1)
})

test('accepts a title alone and defaults the description to an empty string', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, { title: 'Buy milk' })
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { title: 'Buy milk', description: '', location: '', startsAt: null, endsAt: null, estimatedMinutes: null })
})

test('accepts title and description at their maximum lengths', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, { title: 'a'.repeat(200), description: 'b'.repeat(2000) })
  assert.equal(response.status, 201)
})

const invalidBodies = [
  ['zero estimated time', { title: 'Task', estimatedMinutes: 0 }],
  ['negative estimated time', { title: 'Task', estimatedMinutes: -5 }],
  ['fractional estimated time', { title: 'Task', estimatedMinutes: 1.5 }],
  ['string estimated time', { title: 'Task', estimatedMinutes: '30' }],
  ['boolean estimated time', { title: 'Task', estimatedMinutes: true }],
  ['excessive estimated time', { title: 'Task', estimatedMinutes: 10081 }],
  ['numeric location', { title: 'Task', location: 42 }],
  ['null location', { title: 'Task', location: null }],
  ['long location', { title: 'Task', location: 'a'.repeat(501) }],
  ['invalid start time', { title: 'Task', startsAt: 'tomorrow' }],
  ['impossible date', { title: 'Task', startsAt: '2026-02-30T09:00:00Z' }],
  ['time without UTC zone', { title: 'Task', startsAt: '2026-09-09T09:00:00' }],
  ['numeric start time', { title: 'Task', startsAt: 42 }],
  ['invalid end time', { title: 'Task', endsAt: 'tomorrow' }],
  ['end before start', { title: 'Task', startsAt: '2026-09-09T10:00:00Z', endsAt: '2026-09-09T09:00:00Z' }],
  ['equal start and end', { title: 'Task', startsAt: '2026-09-09T10:00:00Z', endsAt: '2026-09-09T10:00:00Z' }],
  ['missing title', {}],
  ['empty title', { title: '' }],
  ['whitespace title', { title: ' \n\t ' }],
  ['numeric title', { title: 42 }],
  ['null title', { title: null }],
  ['long title', { title: 'a'.repeat(201) }],
  ['numeric description', { title: 'Task', description: 42 }],
  ['null description', { title: 'Task', description: null }],
  ['long description', { title: 'Task', description: 'b'.repeat(2001) }],
  ['array body', []],
  ['null body', null],
  ['string body', 'Task'],
]

test('accepts a schedule and trims a location', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, {
    title: 'Study group', location: '  Library, room 2  ',
    startsAt: '2026-09-10T02:00:00.000Z', endsAt: '2026-09-10T03:00:00.000Z',
  })
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), {
    title: 'Study group', description: '', location: 'Library, room 2',
    startsAt: '2026-09-10T02:00:00.000Z', endsAt: '2026-09-10T03:00:00.000Z', estimatedMinutes: null,
  })
})

test('allows a start time without an end time', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, { title: 'Task', startsAt: '2026-09-09T09:00:00Z' })
  assert.equal(response.status, 201)
  assert.equal((await response.json()).endsAt, null)
})

test('accepts a location at the maximum length without a schedule', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, { title: 'Task', location: 'a'.repeat(500) })
  assert.equal(response.status, 201)
  assert.equal((await response.json()).startsAt, null)
})

for (const [name, body] of invalidBodies) {
  test(`rejects ${name} without saving a task`, async (t) => {
    const create = t.mock.fn()
    const url = await startTestServer(t, { create })
    const response = await postTask(url, body)
    assert.equal(response.status, 400)
    assert.equal(typeof (await response.json()).error, 'string')
    assert.equal(create.mock.callCount(), 0)
  })
}

test('rejects malformed JSON with a helpful error', async (t) => {
  const create = t.mock.fn()
  const url = await startTestServer(t, { create })
  const response = await fetch(`${url}/api/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Request body must be valid JSON' })
  assert.equal(create.mock.callCount(), 0)
})

test('requires JSON content type', async (t) => {
  const create = t.mock.fn()
  const url = await startTestServer(t, { create })
  const response = await fetch(`${url}/api/tasks`, { method: 'POST', body: 'title=Task' })
  assert.equal(response.status, 415)
  assert.equal(create.mock.callCount(), 0)
})

test('rejects bodies larger than 1 MB', async (t) => {
  const create = t.mock.fn()
  const url = await startTestServer(t, { create })
  const response = await postTask(url, { title: 'Task', description: 'a'.repeat(1024 * 1024) })
  assert.equal(response.status, 413)
  assert.equal(create.mock.callCount(), 0)
})

test('returns a generic error when saving fails', async (t) => {
  t.mock.method(console, 'error', () => {})
  const url = await startTestServer(t, {
    create: async () => { throw new Error('Private database details') },
  })
  const response = await postTask(url, { title: 'Task' })
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Internal server error' })
})

test('preserves the health endpoint and JSON 404 responses', async (t) => {
  const url = await startTestServer(t, {})
  const health = await fetch(`${url}/health`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })
  const missing = await fetch(`${url}/missing`)
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'Not found' })
})


test('accepts a deadline without a start and saves the estimated time', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  const response = await postTask(url, { title: 'Assignment', endsAt: '2026-09-20T20:00:00Z', estimatedMinutes: 90 })
  assert.equal(response.status, 201)
  const task = await response.json()
  assert.equal(task.startsAt, null)
  assert.equal(task.endsAt, '2026-09-20T20:00:00Z')
  assert.equal(task.estimatedMinutes, 90)
})

test('allows the full estimated time range and explicit null without any dates', async (t) => {
  const url = await startTestServer(t, { create: async (input) => input })
  for (const estimatedMinutes of [1, 10080, null]) {
    const response = await postTask(url, { title: 'Task', estimatedMinutes })
    assert.equal(response.status, 201)
    const task = await response.json()
    assert.equal(task.estimatedMinutes, estimatedMinutes)
    assert.equal(task.startsAt, null)
    assert.equal(task.endsAt, null)
  }
})
