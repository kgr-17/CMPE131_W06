# Dynamic Task Manager

Dynamic Task Manager is a university software-engineering project exploring how to help people choose useful tasks when an unexpected block of free time becomes available. This repository currently contains the development foundation, not the complete application.

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

## Project Structure

```text
frontend/       React and Vite development app
backend/        Express API
docs/           Teammate documentation
.ai/skills/     Task-specific guidance for coding assistants
docker-compose.yml
AI_RULES.md     Canonical policy for coding assistants
```
