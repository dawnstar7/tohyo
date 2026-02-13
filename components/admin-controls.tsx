"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generatePollsAction, closeVotingAction } from "@/app/actions/room";
import { Loader2, Sparkles, Lock, Key } from "lucide-react";
import type { RoomStatus } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

interface AdminControlsProps {
  roomId: string;
  status: RoomStatus;
  entryCount: number;
}

export function AdminControls({ roomId, status, entryCount }: AdminControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    // Check if this user has the admin code saved
    const savedCode = localStorage.getItem(`room_admin_${roomId}`);
    if (savedCode) {
      // Verify the code is valid
      verifyAdminCode(savedCode);
    }
  }, [roomId]);

  const verifyAdminCode = async (code: string) => {
    try {
      const supabase = createClient();
      const { data: room } = await supabase
        .from("rooms")
        .select("admin_code")
        .eq("id", roomId)
        .single();

      if (room && room.admin_code === code) {
        setIsAdmin(true);
        localStorage.setItem(`room_admin_${roomId}`, code);
      } else {
        setIsAdmin(false);
        localStorage.removeItem(`room_admin_${roomId}`);
      }
    } catch (err) {
      console.error("Failed to verify admin code:", err);
      setIsAdmin(false);
    }
  };

  const handleCodeSubmit = async () => {
    setCodeError(null);

    try {
      const supabase = createClient();
      const { data: room } = await supabase
        .from("rooms")
        .select("admin_code")
        .eq("id", roomId)
        .single();

      if (room && room.admin_code === inputCode) {
        setIsAdmin(true);
        localStorage.setItem(`room_admin_${roomId}`, inputCode);
        setShowCodeInput(false);
        setInputCode("");
      } else {
        setCodeError("コードが間違っています");
      }
    } catch (err) {
      setCodeError("エラーが発生しました");
    }
  };

  const handleGeneratePolls = async () => {
    if (entryCount === 0) {
      setError("意見が投稿されていません");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      await generatePollsAction(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseVoting = async () => {
    setError(null);
    setIsClosing(true);

    try {
      await closeVotingAction(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsClosing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="border-t pt-4 mt-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">管理者操作</h3>

        {!showCodeInput ? (
          <Button
            onClick={() => setShowCodeInput(true)}
            variant="outline"
            className="w-full"
          >
            <Key className="mr-2 h-4 w-4" />
            管理者コードを入力
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="4桁のコードを入力"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              maxLength={4}
              className="text-center text-lg tracking-widest"
            />
            {codeError && (
              <p className="text-sm text-destructive">{codeError}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleCodeSubmit}
                disabled={inputCode.length !== 4}
                className="flex-1"
              >
                確認
              </Button>
              <Button
                onClick={() => {
                  setShowCodeInput(false);
                  setInputCode("");
                  setCodeError(null);
                }}
                variant="outline"
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">管理者操作</h3>

      {status === "collecting" && (
        <div className="space-y-2">
          <Button
            onClick={handleGeneratePolls}
            disabled={isGenerating || entryCount === 0}
            className="w-full"
            variant="default"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AIで分析中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                意見を締め切って投票を開始する
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            集まった意見をAIが分析し、投票選択肢を自動生成します
          </p>
        </div>
      )}

      {status === "voting" && (
        <div className="space-y-2">
          <Button
            onClick={handleCloseVoting}
            disabled={isClosing}
            className="w-full"
            variant="destructive"
          >
            {isClosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                締め切り中...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                投票を締め切る
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            投票を終了し、結果を確定します
          </p>
        </div>
      )}

      {status === "closed" && (
        <div className="text-sm text-muted-foreground">
          この投票は締め切られました
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
