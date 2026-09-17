import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { createDatabase, initializeDatabase } from '../src/database.js'
import { createTaskStore } from '../src/task-store.js'
import { postTask, startTestServer } from './helpers.js'

test('creates tasks in PostgreSQL and preserves them after reconnecting and initializing again', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to run database integration tests')
  const database = createDatabase(process.env.TEST_DATABASE_URL)
  // Only this randomly named test schema is removed; application data is untouched.
  const schema = `test_tasks_${randomUUID().replaceAll('-', '')}`
  let client
  t.after(async () => {
    client?.release()
    try {
      await database.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    } finally {
      await database.end()
    }
  })
  await database.query(`CREATE SCHEMA ${schema}`)
  client = await database.connect()
  await client.query(`SET search_path TO ${schema}`)
  // Start with the previous scheduling rule to verify the upgrade preserves tasks.
  await client.query(`CREATE TABLE tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL, description VARCHAR(2000) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(500) NOT NULL DEFAULT '', starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ CHECK (ends_at IS NULL OR (starts_at IS NOT NULL AND ends_at > starts_at))
  )`)
  await client.query("INSERT INTO tasks (title) VALUES ('Existing task')")
  await initializeDatabase(client)
  const legacyResult = await client.query('SELECT * FROM tasks')
  assert.equal(legacyResult.rows[0].title, 'Existing task')
  assert.equal(legacyResult.rows[0].location, '')
  assert.equal(legacyResult.rows[0].starts_at, null)
  assert.equal(legacyResult.rows[0].ends_at, null)
  assert.equal(legacyResult.rows[0].estimated_minutes, null)

  const url = await startTestServer(t, createTaskStore(client))
  const title = "Read O'Reilly; DROP TABLE tasks; --"
  const response = await postTask(url, {
    title, description: '  Check persistence  ', location: '  Library  ',
    startsAt: '2026-09-10T02:00:00.000Z', endsAt: '2026-09-10T03:00:00.000Z', estimatedMinutes: 90,
  })
  assert.equal(response.status, 201)
  const task = await response.json()
  assert.ok(Number.isInteger(task.id) && task.id > 0)
  assert.equal(task.title, title)
  assert.equal(task.description, 'Check persistence')
  assert.equal(task.location, 'Library')
  assert.equal(task.startsAt, '2026-09-10T02:00:00.000Z')
  assert.equal(task.endsAt, '2026-09-10T03:00:00.000Z')
  assert.equal(task.estimatedMinutes, 90)
  assert.equal(task.status, 'pending')
  assert.ok(Number.isFinite(Date.parse(task.createdAt)))

  // Destroy this connection, then initialize with a new one as startup would.
  client.release(true)
  client = undefined
  client = await database.connect()
  await client.query(`SET search_path TO ${schema}`)
  await initializeDatabase(client)
  const stored = await client.query('SELECT * FROM tasks WHERE id = $1', [task.id])
  assert.equal(stored.rows.length, 1)
  assert.equal(stored.rows[0].title, title)
  assert.equal(stored.rows[0].description, task.description)
  assert.equal(stored.rows[0].created_at.toISOString(), task.createdAt)
  assert.equal(stored.rows[0].location, task.location)
  assert.equal(stored.rows[0].starts_at.toISOString(), task.startsAt)
  assert.equal(stored.rows[0].ends_at.toISOString(), task.endsAt)
  assert.equal(stored.rows[0].estimated_minutes, 90)

  const restartedUrl = await startTestServer(t, createTaskStore(client))
  const secondResponse = await postTask(restartedUrl, {
    title: 'Deadline without a start', endsAt: '2026-09-20T20:00:00.000Z', estimatedMinutes: 30,
  })
  assert.equal(secondResponse.status, 201)
  const second = await secondResponse.json()
  assert.notEqual(second.id, task.id)
  assert.equal(second.description, '')
  assert.equal(second.status, 'pending')
  assert.equal(second.startsAt, null)
  assert.equal(second.endsAt, '2026-09-20T20:00:00.000Z')
  assert.equal(second.estimatedMinutes, 30)
  assert.equal(second.location, '')

  const invalid = await postTask(restartedUrl, { title: ' ' })
  assert.equal(invalid.status, 400)
  const count = await client.query('SELECT count(*)::integer AS count FROM tasks')
  assert.equal(count.rows[0].count, 3)
  await initializeDatabase(client)

  const listResponse = await fetch(`${restartedUrl}/api/tasks`)
  assert.equal(listResponse.status, 200)
  const listedTasks = await listResponse.json()
  assert.deepEqual(listedTasks.slice(0, 2), [second, task])
  assert.equal(listedTasks[2].title, 'Existing task')
  assert.equal(listedTasks[2].startsAt, null)
  assert.equal(listedTasks[2].estimatedMinutes, null)

  await assert.rejects(client.query("INSERT INTO tasks (title, estimated_minutes) VALUES ('Invalid', 0)"), { code: '23514' })
  await assert.rejects(client.query("INSERT INTO tasks (title, starts_at, ends_at) VALUES ('Invalid', '2026-09-20T20:00:00Z', '2026-09-20T19:00:00Z')"), { code: '23514' })
})
