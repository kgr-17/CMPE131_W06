import cors from 'cors'
import express from 'express'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: frontendOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
})

export default app
