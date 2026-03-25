"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageItem } from "./ChatMessageItem";

interface ChatMsg {
  id: string;
  speaker: "A" | "B";
  text: string;
}

interface ClassResult {
  messageId: string;
  code: string;
  confidence: number;
  needsReview: boolean;
}

interface Props {
  messages: ChatMsg[];
  classifications?: ClassResult[];
  selectedId?: string;
  highlightCode?: string | null;
  onSelect?: (id: string) => void;
}

export function ChatTimeline({ messages, classifications, selectedId, highlightCode, onSelect }: Props) {
  const classMap = new Map(classifications?.map((c) => [c.messageId, c]));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-4">
        {messages.map((msg) => {
          const cls = classMap.get(msg.id);
          const dimmed = !!highlightCode && cls?.code !== highlightCode;
          return (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              classification={cls}
              isSelected={selectedId === msg.id}
              dimmed={dimmed}
              onClick={() => onSelect?.(msg.id)}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
