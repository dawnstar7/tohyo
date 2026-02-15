-- Add comment and nickname columns to votes table
ALTER TABLE votes
ADD COLUMN nickname TEXT,
ADD COLUMN comment TEXT;

-- Create index for faster lookups
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
