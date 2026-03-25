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
  onSelect?: (id: string) => void;
}

export function ChatTimeline({ messages, classifications, selectedId, onSelect }: Props) {
  const classMap = new Map(classifications?.map((c) => [c.messageId, c]));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-4">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            classification={classMap.get(msg.id)}
            isSelected={selectedId === msg.id}
            onClick={() => onSelect?.(msg.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
