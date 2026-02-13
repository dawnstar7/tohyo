-- Add admin_token column to rooms table
ALTER TABLE rooms ADD COLUMN admin_token UUID DEFAULT uuid_generate_v4();

-- Create index for faster admin token lookups
CREATE INDEX idx_rooms_admin_token ON rooms(admin_token);
