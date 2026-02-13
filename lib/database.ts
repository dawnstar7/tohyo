import { createClient } from "@/lib/supabase/client";
import type {
  Room,
  Entry,
  Poll,
  Vote,
  RoomInsert,
  EntryInsert,
  PollInsert,
  VoteInsert,
  RoomUpdate,
  RoomWithStats,
  PollWithVotes,
} from "@/lib/types/database";

// ============================================
// ROOMS
// ============================================

/**
 * Get all rooms ordered by creation date (newest first)
 */
export async function getRooms() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Room[];
}

/**
 * Get a single room by ID
 */
export async function getRoom(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Room;
}

/**
 * Get room with entry, poll, and vote counts
 */
export async function getRoomWithStats(id: string) {
  const supabase = createClient();

  const [room, entries, polls] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", id).single(),
    supabase.from("entries").select("id", { count: "exact" }).eq("room_id", id),
    supabase.from("polls").select("id", { count: "exact" }).eq("room_id", id),
  ]);

  if (room.error) throw room.error;

  // Get total vote count across all polls
  const { count: voteCount } = await supabase
    .from("votes")
    .select("id", { count: "exact" })
    .in("poll_id", polls.data?.map((p) => p.id) || []);

  return {
    ...room.data,
    entry_count: entries.count || 0,
    poll_count: polls.count || 0,
    vote_count: voteCount || 0,
  } as RoomWithStats;
}

/**
 * Create a new room
 */
export async function createRoom(room: RoomInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .insert(room)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

/**
 * Update a room
 */
export async function updateRoom(id: string, updates: RoomUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

/**
 * Delete a room (cascades to entries, polls, votes)
 */
export async function deleteRoom(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// ENTRIES
// ============================================

/**
 * Get all entries for a room
 */
export async function getEntries(roomId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Entry[];
}

/**
 * Create a new entry
 */
export async function createEntry(entry: EntryInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("entries")
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data as Entry;
}

/**
 * Delete an entry
 */
export async function deleteEntry(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// POLLS
// ============================================

/**
 * Get all polls for a room
 */
export async function getPolls(roomId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Poll[];
}

/**
 * Get polls with vote counts
 */
export async function getPollsWithVotes(roomId: string) {
  const supabase = createClient();
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Get vote counts for each poll
  const pollsWithVotes = await Promise.all(
    polls.map(async (poll) => {
      const { count } = await supabase
        .from("votes")
        .select("id", { count: "exact" })
        .eq("poll_id", poll.id);

      return {
        ...poll,
        vote_count: count || 0,
      };
    })
  );

  return pollsWithVotes as PollWithVotes[];
}

/**
 * Create a new poll option
 */
export async function createPoll(poll: PollInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("polls")
    .insert(poll)
    .select()
    .single();

  if (error) throw error;
  return data as Poll;
}

/**
 * Create multiple poll options at once
 */
export async function createPolls(polls: PollInsert[]) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("polls")
    .insert(polls)
    .select();

  if (error) throw error;
  return data as Poll[];
}

/**
 * Delete a poll (cascades to votes)
 */
export async function deletePoll(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("polls").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// VOTES
// ============================================

/**
 * Get all votes for a poll
 */
export async function getVotes(pollId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Vote[];
}

/**
 * Get all votes for a room (across all polls)
 */
export async function getRoomVotes(roomId: string) {
  const supabase = createClient();

  // First get all poll IDs for this room
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("id")
    .eq("room_id", roomId);

  if (pollsError) throw pollsError;

  const pollIds = polls.map((p) => p.id);
  if (pollIds.length === 0) return [];

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .in("poll_id", pollIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Vote[];
}

/**
 * Create a new vote
 */
export async function createVote(vote: VoteInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("votes")
    .insert(vote)
    .select()
    .single();

  if (error) throw error;
  return data as Vote;
}

/**
 * Check if a user has already voted for a specific poll
 */
export async function hasUserVoted(pollId: string, userIdHash: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id_hash", userIdHash)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
  return !!data;
}

/**
 * Get all poll IDs that a user has voted for in a room
 */
export async function getUserVotesInRoom(roomId: string, userIdHash: string) {
  const supabase = createClient();

  // First get all poll IDs for this room
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("id")
    .eq("room_id", roomId);

  if (pollsError) throw pollsError;

  const pollIds = polls.map((p) => p.id);
  if (pollIds.length === 0) return [];

  const { data, error } = await supabase
    .from("votes")
    .select("poll_id")
    .in("poll_id", pollIds)
    .eq("user_id_hash", userIdHash);

  if (error) throw error;
  return data.map((v) => v.poll_id);
}

/**
 * Delete a vote
 */
export async function deleteVote(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("votes").delete().eq("id", id);

  if (error) throw error;
}
