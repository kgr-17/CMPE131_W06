import { once } from 'node:events'
import { createApp } from '../src/app.js'

export async function startTestServer(t, taskStore) {
  const server = createApp({ taskStore }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
    server.closeAllConnections()
  }))
  return `http://127.0.0.1:${server.address().port}`
}

export function postTask(url, body) {
  return fetch(`${url}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
