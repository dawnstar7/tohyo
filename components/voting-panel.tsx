"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitVoteAction } from "@/app/actions/room";
import { generateUserIdHash } from "@/lib/utils/hash";
import { Check, Loader2 } from "lucide-react";

interface Poll {
  id: string;
  option_text: string;
  explanation: string | null;
  vote_count: number;
}

interface VotingPanelProps {
  polls: Poll[];
  userVotedPollIds: string[];
  showRanking?: boolean;
}

export function VotingPanel({ polls, userVotedPollIds: initialVotedIds, showRanking = false }: VotingPanelProps) {
  const [userIdHash, setUserIdHash] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [votedPollIds, setVotedPollIds] = useState<string[]>(initialVotedIds);
  const [error, setError] = useState<string | null>(null);

  // Sort polls by vote count if showing ranking
  const displayPolls = showRanking
    ? [...polls].sort((a, b) => b.vote_count - a.vote_count)
    : polls;

  useEffect(() => {
    generateUserIdHash().then(setUserIdHash);
  }, []);

  const handleVote = async (pollId: string) => {
    if (!userIdHash) {
      setError("ユーザーIDを生成中です...");
      return;
    }

    if (votedPollIds.includes(pollId)) {
      setError("既にこの選択肢に投票済みです");
      return;
    }

    setError(null);
    setVotingFor(pollId);

    try {
      await submitVoteAction(pollId, userIdHash);
      setVotedPollIds([...votedPollIds, pollId]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "投票に失敗しました");
    } finally {
      setVotingFor(null);
    }
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        投票選択肢がありません
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = polls.reduce((sum, poll) => sum + poll.vote_count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">投票</h3>
        <Badge variant="secondary">総投票数: {totalVotes}</Badge>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {displayPolls.map((poll, index) => {
          const isVoted = votedPollIds.includes(poll.id);
          const isVoting = votingFor === poll.id;
          const votePercentage = totalVotes > 0
            ? Math.round((poll.vote_count / totalVotes) * 100)
            : 0;
          const rank = index + 1;

          // Medal emoji for top 3
          const getMedal = (rank: number) => {
            if (!showRanking) return null;
            switch (rank) {
              case 1: return "🥇";
              case 2: return "🥈";
              case 3: return "🥉";
              default: return `${rank}位`;
            }
          };

          return (
            <Card key={poll.id} className={isVoted ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 flex items-start gap-3">
                    {showRanking && (
                      <span className="text-2xl font-bold">{getMedal(rank)}</span>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">{poll.option_text}</CardTitle>
                      {poll.explanation && (
                        <CardDescription className="mt-2">
                          {poll.explanation}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={isVoted ? "default" : "outline"}>
                      {poll.vote_count}票 ({votePercentage}%)
                    </Badge>
                    {isVoted && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        投票済み
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Vote progress bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${votePercentage}%` }}
                    />
                  </div>

                  {!isVoted && (
                    <Button
                      onClick={() => handleVote(poll.id)}
                      disabled={isVoting || !userIdHash}
                      className="w-full"
                      variant="outline"
                    >
                      {isVoting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          投票中...
                        </>
                      ) : (
                        "この選択肢に投票する"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
