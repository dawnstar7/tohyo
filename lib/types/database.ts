// Database types for TOHYO app

export type RoomStatus = 'collecting' | 'voting' | 'closed';

export interface Room {
  id: string;
  title: string;
  status: RoomStatus;
  admin_token: string;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  room_id: string;
  content: string;
  created_at: string;
}

export interface Poll {
  id: string;
  room_id: string;
  option_text: string;
  explanation: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id_hash: string;
  created_at: string;
}

// Insert types (without auto-generated fields)
export type RoomInsert = Omit<Room, 'id' | 'created_at' | 'updated_at'> & {
  status?: RoomStatus;
};

export type EntryInsert = Omit<Entry, 'id' | 'created_at'>;

export type PollInsert = Omit<Poll, 'id' | 'created_at'>;

export type VoteInsert = Omit<Vote, 'id' | 'created_at'>;

// Update types (all fields optional except id)
export type RoomUpdate = Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>;

// Extended types with relations
export interface RoomWithStats extends Room {
  entry_count: number;
  poll_count: number;
  vote_count: number;
}

export interface PollWithVotes extends Poll {
  vote_count: number;
  votes?: Vote[];
}
