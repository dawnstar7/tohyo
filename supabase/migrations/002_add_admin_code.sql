-- Add admin_code column to rooms table (4-digit code)
ALTER TABLE rooms ADD COLUMN admin_code TEXT NOT NULL DEFAULT floor(random() * 9000 + 1000)::text;

-- Create index for faster admin code lookups
CREATE INDEX idx_rooms_admin_code ON rooms(admin_code);
