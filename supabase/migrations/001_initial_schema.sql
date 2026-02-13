-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for room status
CREATE TYPE room_status AS ENUM ('collecting', 'voting', 'closed');

-- Rooms table: 議論・投票のルーム
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'collecting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entries table: ユーザーの生の声・意見
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT entries_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Polls table: AIが生成した投票選択肢
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT polls_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Votes table: 投票データ（重複防止用のハッシュ付き）
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES polls(id),
  -- 同じユーザーが同じ選択肢に複数回投票できないようにする
  CONSTRAINT votes_unique_user_poll UNIQUE (poll_id, user_id_hash)
);

-- Indexes for better query performance
CREATE INDEX idx_entries_room_id ON entries(room_id);
CREATE INDEX idx_polls_room_id ON polls(room_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id_hash ON votes(user_id_hash);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on rooms table
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow all users to read rooms
CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  TO public
  USING (true);

-- Allow all users to create rooms
CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow all users to update rooms
CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  TO public
  USING (true);

-- Allow all users to read entries
CREATE POLICY "Entries are viewable by everyone"
  ON entries FOR SELECT
  TO public
  USING (true);

-- Allow all users to create entries
CREATE POLICY "Anyone can create entries"
  ON entries FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow all users to read polls
CREATE POLICY "Polls are viewable by everyone"
  ON polls FOR SELECT
  TO public
  USING (true);

-- Allow all users to create polls
CREATE POLICY "Anyone can create polls"
  ON polls FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow all users to read votes
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  TO public
  USING (true);

-- Allow all users to create votes
CREATE POLICY "Anyone can create votes"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);
