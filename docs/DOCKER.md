# Docker Development Guide

Docker runs the frontend, backend, and PostgreSQL database together. You do not need to install Node.js or PostgreSQL on your computer.

## First-Time Setup

1. Install and open [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Clone this repository and open a terminal in its root folder.
3. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   In Windows PowerShell, use `Copy-Item .env.example .env` instead.

4. Build and start everything:

   ```bash
   docker compose up --build
   ```

5. Open the frontend at <http://localhost:5173>.
6. Check the backend at <http://localhost:3000/health>. It should return `{"status":"ok"}`.
7. Try creating a task using the example in [the README](../README.md#add-a-task). The backend creates its PostgreSQL task table automatically on startup.

The first build can take a few minutes while Docker downloads images and installs packages.

## Everyday Commands

Stop the running process with `Ctrl+C`, then remove its containers and network:

```bash
docker compose down
```

Database data is kept for the next start. Start normally with:

```bash
docker compose up
```

Rebuild after dependency or Dockerfile changes:

```bash
docker compose up --build
```

Follow logs from all services:

```bash
docker compose logs -f
```

Check service status:

```bash
docker compose ps
```

> **Warning:** `docker compose down -v` deletes the named volumes, including all local PostgreSQL data. Do not use it unless you intentionally want a fresh database.

## Troubleshooting

- **Docker command fails:** Open Docker Desktop and wait until it reports that Docker is running.
- **Port already in use:** Stop the program using ports 5173, 3000, or 5432. Alternatively, change the corresponding port in `.env` and restart.
- **A dependency change is missing:** Dependencies are stored in named volumes, which can retain older packages after rebuilding. Run `docker compose run --rm --no-deps backend npm ci` for backend dependencies (or replace `backend` with `frontend`), then `docker compose up --build`. This preserves PostgreSQL data.
- **A service exits or the page does not load:** Run `docker compose ps`, then `docker compose logs -f` to find the error.
