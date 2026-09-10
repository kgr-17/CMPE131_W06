import { createApp } from './app.js'
import { createDatabase, initializeDatabase } from './database.js'
import { createTaskStore } from './task-store.js'

const port = Number(process.env.PORT) || 3000
const database = createDatabase(process.env.DATABASE_URL)

try {
  // Initialize before accepting requests so the task table is ready to use.
  await initializeDatabase(database)
  const app = createApp({ taskStore: createTaskStore(database) })
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening on port ${port}`)
  })

  function shutdown() {
    server.close(async () => {
      await database.end()
    })
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
} catch (error) {
  console.error('Unable to initialize the database', error)
  await database.end()
  process.exitCode = 1
}
