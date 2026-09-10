import { readFile } from 'node:fs/promises'
import pg from 'pg'

export function createDatabase(connectionString) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 })
  pool.on('error', (error) => {
    console.error('Unexpected database connection error', error)
  })
  return pool
}

export async function initializeDatabase(database) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  await database.query(schema)
}
