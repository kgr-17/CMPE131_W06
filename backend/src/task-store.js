export function createTaskStore(database) {
  return {
    async list() {
      const result = await database.query(
        `SELECT id, title, description, location, starts_at AS "startsAt", ends_at AS "endsAt",
                status, created_at AS "createdAt"
         FROM tasks ORDER BY created_at DESC, id DESC`,
      )
      return result.rows
    },

    async create({ title, description, location, startsAt, endsAt }) {
      const result = await database.query(
        `INSERT INTO tasks (title, description, location, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, description, location, starts_at AS "startsAt", ends_at AS "endsAt",
                   status, created_at AS "createdAt"`,
        [title, description, location, startsAt, endsAt],
      )
      return result.rows[0]
    },
  }
}
