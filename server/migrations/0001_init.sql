CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT,
  name TEXT NOT NULL,
  avatar JSONB NOT NULL DEFAULT '{"face":0,"color":"#5aa9e6","hat":0}',
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_user_id UUID REFERENCES users(id),
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracks each player's persistent standing in a room so score/seat can
-- survive an unexpected disconnect and be restored on resume.
CREATE TABLE IF NOT EXISTS room_players (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  join_order INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT TRUE,
  disconnected_at TIMESTAMPTZ,
  left_permanently BOOLEAN NOT NULL DEFAULT FALSE,
  avatar JSONB NOT NULL DEFAULT '{"face":0,"color":"#5aa9e6","hat":0}',
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
