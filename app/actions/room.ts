"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeEntriesAndGeneratePolls } from "@/lib/ai/analyze";
import type { RoomInsert, EntryInsert, VoteInsert } from "@/lib/types/database";

/**
 * Create a new room
 */
export async function createRoomAction(title: string) {
  if (!title || title.trim().length === 0) {
    throw new Error("議題を入力してください");
  }

  const supabase = await createClient();

  const roomData: RoomInsert = {
    title: title.trim(),
    status: "collecting",
  };

  const { data, error } = await supabase
    .from("rooms")
    .insert(roomData)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data;
}

/**
 * Submit an entry (opinion) to a room
 */
export async function submitEntryAction(roomId: string, content: string) {
  if (!content || content.trim().length === 0) {
    throw new Error("意見を入力してください");
  }

  const supabase = await createClient();

  // Check if room exists and is in collecting status
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", roomId)
    .single();

  if (roomError) throw new Error("ルームが見つかりません");
  if (room.status !== "collecting") {
    throw new Error("このルームは意見を受け付けていません");
  }

  const entryData: EntryInsert = {
    room_id: roomId,
    content: content.trim(),
  };

  const { data, error } = await supabase
    .from("entries")
    .insert(entryData)
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/${roomId}`);
  return data;
}

/**
 * Close entry collection and generate poll options using AI
 */
export async function generatePollsAction(roomId: string) {
  const supabase = await createClient();

  // Get room and verify status
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError) throw new Error("ルームが見つかりません");
  if (room.status !== "collecting") {
    throw new Error("このルームは既に投票フェーズに移行しています");
  }

  // Get all entries for this room
  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("content")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (entriesError) throw entriesError;
  if (!entries || entries.length === 0) {
    throw new Error("意見が投稿されていません");
  }

  // Analyze entries with AI
  const entryTexts = entries.map((e) => e.content);
  const analysisResult = await analyzeEntriesAndGeneratePolls(
    entryTexts,
    room.title
  );

  // Insert generated polls
  const pollsData = analysisResult.options.map((option) => ({
    room_id: roomId,
    option_text: option.option_text,
    explanation: option.explanation,
  }));

  const { error: pollsError } = await supabase
    .from("polls")
    .insert(pollsData);

  if (pollsError) throw pollsError;

  // Update room status to voting
  const { error: updateError } = await supabase
    .from("rooms")
    .update({ status: "voting" })
    .eq("id", roomId);

  if (updateError) throw updateError;

  revalidatePath(`/${roomId}`);
  return analysisResult;
}

/**
 * Submit a vote
 */
export async function submitVoteAction(
  pollId: string,
  userIdHash: string,
  nickname?: string,
  comment?: string
) {
  const supabase = await createClient();

  // Check if user has already voted for this poll
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id_hash", userIdHash)
    .single();

  if (existingVote) {
    throw new Error("既にこの選択肢に投票済みです");
  }

  const voteData: VoteInsert = {
    poll_id: pollId,
    user_id_hash: userIdHash,
    nickname: nickname?.trim() || null,
    comment: comment?.trim() || null,
  };

  const { data, error } = await supabase
    .from("votes")
    .insert(voteData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("既にこの選択肢に投票済みです");
    }
    throw error;
  }

  // Revalidate the room page to show updated vote counts
  const { data: poll } = await supabase
    .from("polls")
    .select("room_id")
    .eq("id", pollId)
    .single();

  if (poll) {
    revalidatePath(`/${poll.room_id}`);
  }

  return data;
}

/**
 * Close voting for a room
 */
export async function closeVotingAction(roomId: string) {
  const supabase = await createClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", roomId)
    .single();

  if (roomError) throw new Error("ルームが見つかりません");
  if (room.status !== "voting") {
    throw new Error("このルームは投票中ではありません");
  }

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ status: "closed" })
    .eq("id", roomId);

  if (updateError) throw updateError;

  revalidatePath(`/${roomId}`);
}
