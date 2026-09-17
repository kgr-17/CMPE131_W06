# Task API

## Plan and Scope

1. Connect the existing Express backend to PostgreSQL.
2. Initialize a small task table at backend startup.
3. Implement and validate `POST /api/tasks`.
4. Test request handling and database persistence.

The app now supports creating and listing tasks through a responsive webpage. Tasks are shared application data; accounts, completing, editing, and deleting are not implemented yet.

## List Tasks

`GET http://localhost:3000/api/tasks`

Returns `200 OK` with a JSON array of saved tasks in newest-first order (creation timestamp, then ID). Each object has the same fields as the create response below. Returns `[]` when no tasks exist. The webpage loads this endpoint on opening or refreshing, and adds successful submissions to the visible list immediately.

A database failure returns `500` with `{ "error": "Internal server error" }`.

## Create a Task

`POST http://localhost:3000/api/tasks`

Send `Content-Type: application/json` and a JSON object:

```json
{
  "title": "Finish homework",
  "description": "Complete chapter 3 exercises",
  "location": "Library, room 2",
  "startsAt": "2026-09-10T02:00:00.000Z",
  "endsAt": "2026-09-10T03:00:00.000Z",
  "estimatedMinutes": 60
}
```

| Field | Rule |
| --- | --- |
| `title` | Required string, 1–200 characters after trimming surrounding whitespace. |
| `description` | Optional string, at most 2,000 characters after trimming. Defaults to `""`. |
| `location` | Optional place or video call URL, at most 500 characters after trimming. Defaults to `""`. |
| `startsAt` | Optional UTC timestamp, e.g. `2026-09-10T02:00:00.000Z`. Defaults to `null`. |
| `endsAt` | Optional UTC deadline. Can be saved without a start time. When both times are provided, the end must be later. Defaults to `null`. |
| `estimatedMinutes` | Optional whole number from 1 to 10,080 minutes (7 days). Defaults to `null`. Stored separately from scheduled times. |

Timestamps must use `YYYY-MM-DDTHH:MM:SSZ` or `YYYY-MM-DDTHH:MM:SS.sssZ`. The webpage converts local dates and times to UTC for storage and displays them in the viewer's local time zone. Dates, calendar labels, and validation messages use English regardless of browser language. Turn on **Date & time** to set a deadline; **Include a start time** is optional and off by default. Leave scheduling off for a task without dates. Times use the 24-hour `HH:MM` input format; the calendar also supports typing `MM/DD/YYYY` directly. The estimated time field accepts minutes or hours (for example, 1.5 hours becomes 90 minutes).

Other input fields are ignored. The server controls the ID, status, and timestamp.

Successful response: `201 Created` (example values below).

```json
{
  "id": 1,
  "title": "Finish homework",
  "description": "Complete chapter 3 exercises",
  "location": "Library, room 2",
  "startsAt": "2026-09-10T02:00:00.000Z",
  "endsAt": "2026-09-10T03:00:00.000Z",
  "estimatedMinutes": 60,
  "status": "pending",
  "createdAt": "2026-09-09T12:00:00.000Z"
}
```

Every task starts as `pending`. `createdAt` is an ISO 8601 timestamp. The database generates the ID and timestamp, and the response is sent after the insert succeeds.

Errors use `{ "error": "Message" }`:

| HTTP status | Meaning |
| --- | --- |
| `400` | Invalid fields, an invalid JSON body, or malformed JSON. |
| `413` | Request body exceeds the 1 MB limit. |
| `415` | Request does not use `Content-Type: application/json`. |
| `500` | An unexpected server or database error; internal details are not returned. |

`GET /health` continues to return `{ "status": "ok" }`. This is a server liveness check, not a continuous database availability check.

## Priority and Calendar Views

Both views use `GET /api/tasks`; there is no additional ranking or recommendation endpoint.

- **Priority:** Pending tasks with an end time, sorted by earliest end time first. Overdue tasks remain at the top and are labeled. Equal deadlines use the task ID as a stable tie-breaker. Estimated time does not affect priority.
- **Calendar:** A month view with previous/next month, Today, and a task list for the selected day. A task with only an end time appears on its deadline date. A task with both times appears on each local day its range overlaps, excluding the following day if the end is exactly midnight. A task with only a start appears on that date. Arrow keys move between days.
- **All tasks:** Keeps every task visible, including tasks without dates, newest first.

The future recommendation system is tracked in [TODO.md](TODO.md). Its logic is being designed by a teammate and has not been implemented.

## Storage and Configuration

The backend requires `DATABASE_URL`, provided by Docker Compose. It connects to PostgreSQL and runs `backend/src/schema.sql` before accepting requests. Initialization creates the table if missing, adds missing location, schedule, and estimate fields, and replaces the earlier constraint that required a start time. Existing rows and their schedules remain intact; old tasks have a `null` estimate. Future schema changes also need explicit migrations; editing `CREATE TABLE IF NOT EXISTS` does not update an existing table.

PostgreSQL stores tasks in the existing `postgres_data` named volume. Normal container restarts and `docker compose down` preserve that data.

## Verification

Run API tests inside the backend container:

```bash
docker compose exec backend npm test
docker compose exec frontend npm test
```

Run integration tests against the configured PostgreSQL database:

```bash
docker compose exec backend sh -c 'TEST_DATABASE_URL="$DATABASE_URL" npm run test:integration'
```

The integration test creates a randomly named schema, checks task creation and persistence after reconnecting and initializing again, and removes only that test schema afterward.

For API tests without Docker, use Node.js 22:

```bash
cd backend
npm ci
npm test
```

To inspect saved tasks during development:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, title, description, status, created_at FROM tasks ORDER BY id;"'
```

Implementation references: [node-postgres parameterized queries](https://node-postgres.com/features/queries) and [Express error handling](https://expressjs.com/en/guide/error-handling/).
