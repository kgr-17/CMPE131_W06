import cors from 'cors'
import express from 'express'

function isUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) return false
  const date = new Date(value)
  const normalized = value.length === 20 ? value.replace('Z', '.000Z') : value
  return Number.isFinite(date.getTime()) && date.toISOString() === normalized
}

export function createApp({ taskStore }) {
  const app = express()
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

  app.use(cors({ origin: frontendOrigin }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/tasks', async (_request, response) => {
    response.json(await taskStore.list())
  })

  app.post('/api/tasks', async (request, response) => {
    if (!request.is('application/json')) {
      return response.status(415).json({ error: 'Content-Type must be application/json' })
    }

    const body = request.body
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response.status(400).json({ error: 'Request body must be a JSON object' })
    }

    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200) {
      return response.status(400).json({ error: 'Title must be between 1 and 200 characters' })
    }

    if (body.description !== undefined &&
        (typeof body.description !== 'string' || body.description.trim().length > 2000)) {
      return response.status(400).json({ error: 'Description must be a string of at most 2000 characters' })
    }

    if (body.location !== undefined &&
        (typeof body.location !== 'string' || body.location.trim().length > 500)) {
      return response.status(400).json({ error: 'Location must be a string of at most 500 characters' })
    }

    const startsAt = body.startsAt ?? null
    const endsAt = body.endsAt ?? null
    if ((startsAt !== null && !isUtcTimestamp(startsAt)) || (endsAt !== null && !isUtcTimestamp(endsAt))) {
      return response.status(400).json({ error: 'Start and end times must be valid UTC timestamps, for example 2026-09-10T02:00:00.000Z' })
    }
    if (endsAt !== null && startsAt !== null && new Date(endsAt) <= new Date(startsAt)) {
      return response.status(400).json({ error: 'End time must be after the start time' })
    }

    const estimatedMinutes = body.estimatedMinutes ?? null
    if (estimatedMinutes !== null &&
        (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 10080)) {
      return response.status(400).json({ error: 'Estimated time must be a whole number from 1 to 10080 minutes' })
    }

    const task = await taskStore.create({
      title: body.title.trim(),
      description: body.description?.trim() ?? '',
      location: body.location?.trim() ?? '',
      startsAt,
      endsAt,
      estimatedMinutes,
    })
    response.status(201).json(task)
  })

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' })
  })

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Request body must be valid JSON' })
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Request body is too large' })
    }

    console.error(error)
    response.status(500).json({ error: 'Internal server error' })
  })

  return app
}
