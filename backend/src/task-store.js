export function createTaskStore(database) {
  return {
    async list() {
      const result = await database.query(
        `SELECT id, title, description, location, starts_at AS "startsAt", ends_at AS "endsAt",
                estimated_minutes AS "estimatedMinutes", status, created_at AS "createdAt"
         FROM tasks ORDER BY created_at DESC, id DESC`,
      )
      return result.rows
    },

    async create({ title, description, location, startsAt, endsAt, estimatedMinutes }) {
      const result = await database.query(
        `INSERT INTO tasks (title, description, location, starts_at, ends_at, estimated_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, location, starts_at AS "startsAt", ends_at AS "endsAt",
                   estimated_minutes AS "estimatedMinutes", status, created_at AS "createdAt"`,
        [title, description, location, startsAt, endsAt, estimatedMinutes],
      )
      return result.rows[0]
    },
  }
}
