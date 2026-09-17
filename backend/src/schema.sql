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
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Replace the earlier rule so a deadline can be saved without a start time.
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_check,
  DROP CONSTRAINT IF EXISTS tasks_ends_at_check,
  ADD CONSTRAINT tasks_ends_at_check
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER
  CHECK (estimated_minutes BETWEEN 1 AND 10080);
