CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add scheduling fields to existing databases without replacing saved tasks.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ
  CHECK (ends_at IS NULL OR (starts_at IS NOT NULL AND ends_at > starts_at));
