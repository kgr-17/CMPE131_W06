# Dynamic Task Manager

Dynamic Task Manager is a university software-engineering project exploring how to help people choose useful tasks when an unexpected block of free time becomes available. The web app lets you add tasks with optional notes and see your saved tasks. Express stores tasks in PostgreSQL so they remain available after refreshing the page.

## Quick Start

Docker Desktop is the only development dependency.

```bash
cp .env.example .env
docker compose up --build
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the first command.

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:3000/health>

See [docs/DOCKER.md](docs/DOCKER.md) for beginner-friendly setup and troubleshooting.

## Add a Task

With Docker Compose running, open <http://localhost:5173>, enter a task name, optional location and notes, and select **Add task**. Turn on **Date & time** to add a start/end date and time using the English calendar picker. Saved tasks show their schedule and location beside the form (below it on a phone), newest first. Dates and messages are displayed in English, and scheduled times use your local time zone.

You can also send a JSON request directly to the backend:

```bash
curl -i http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Finish homework","description":"Complete chapter 3 exercises"}'
```

On Windows PowerShell, use `Invoke-RestMethod`:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tasks -ContentType 'application/json' -Body '{"title":"Finish homework","description":"Complete chapter 3 exercises"}'
```

The API returns `201 Created` with the saved task. See [docs/API.md](docs/API.md) for fields, validation, and tests. Completing, editing, deleting, and accounts are future steps.

## Project Progress

Read the [project overview](docs/overview.md) for our current progress and next-step ideas. Daily work is recorded in the [log folder](docs/log/).

## Project Structure

```text
frontend/       React and Vite development app
backend/        Express API
docs/           Setup guides, project overview, and daily progress logs
.ai/skills/     Task-specific guidance for coding assistants
docker-compose.yml
AI_RULES.md     Canonical policy for coding assistants
```
