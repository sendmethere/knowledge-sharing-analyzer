"use client";

import { useState, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function AIChatInput({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t bg-white">
      <textarea
        className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
        placeholder="분석 결과에 대해 질문해보세요…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        rows={1}
        disabled={isStreaming}
      />
      {isStreaming ? (
        <Button size="icon" variant="outline" onClick={onStop}>
          <Square className="w-4 h-4" />
        </Button>
      ) : (
        <Button size="icon" onClick={handleSend} disabled={!value.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
