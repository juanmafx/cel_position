-- Optional SQLite schema for storing captured orientation sessions.
-- The application does not read or write this database.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS capture_sessions (
  id INTEGER PRIMARY KEY,
  started_at TEXT NOT NULL CHECK (strftime('%Y-%m-%dT%H:%M:%SZ', started_at) IS started_at),
  ended_at TEXT CHECK (ended_at IS NULL OR strftime('%Y-%m-%dT%H:%M:%SZ', ended_at) IS ended_at),
  gyroscope_detected INTEGER NOT NULL DEFAULT 0 CHECK (gyroscope_detected IN (0, 1)),
  label TEXT CHECK (label IS NULL OR length(label) <= 120),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
) STRICT;

CREATE TABLE IF NOT EXISTS orientation_samples (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES capture_sessions (id) ON DELETE CASCADE,
  offset_ms INTEGER NOT NULL CHECK (offset_ms >= 0),
  is_absolute INTEGER NOT NULL DEFAULT 0 CHECK (is_absolute IN (0, 1)),
  alpha_degrees REAL CHECK (alpha_degrees IS NULL OR alpha_degrees BETWEEN 0 AND 360),
  beta_degrees REAL CHECK (beta_degrees IS NULL OR beta_degrees BETWEEN -180 AND 180),
  gamma_degrees REAL CHECK (gamma_degrees IS NULL OR gamma_degrees BETWEEN -90 AND 90),
  UNIQUE (session_id, offset_ms)
) STRICT;
