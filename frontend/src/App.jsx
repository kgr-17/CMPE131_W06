import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking backend...')

  useEffect(() => {
    const controller = new AbortController()

    async function checkBackend() {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`)
        }

        const data = await response.json()
        setApiStatus(data.status === 'ok' ? 'Backend connected' : 'Backend unavailable')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiStatus('Backend unavailable')
        }
      }
    }

    checkBackend()
    return () => controller.abort()
  }, [])

  return (
    <main className="page-shell">
      <section className="welcome-card" aria-labelledby="app-title">
        <p className="eyebrow">Development foundation</p>
        <h1 id="app-title">Dynamic Task Manager</h1>
        <p className="summary">
          A simple starting point for organizing tasks around the time you have available.
        </p>
        <p className="status" role="status">
          <span aria-hidden="true" className="status-dot" />
          {apiStatus}
        </p>
      </section>
    </main>
  )
}

export default App
