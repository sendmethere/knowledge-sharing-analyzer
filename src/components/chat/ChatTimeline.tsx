"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageItem } from "./ChatMessageItem";
import { CCTAnalysis, Episode } from "@/lib/types";

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
  cctAnalysis?: CCTAnalysis;
}

function EpisodeHeader({ episode }: { episode: Episode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 my-1">
      <div className="flex-1 h-px bg-gray-200" />
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-gray-500">{episode.topicLabel}</span>
        {episode.isInteractionEpisode && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 font-medium">IE</span>
        )}
        {episode.ccoTurnCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">CCT×{episode.ccoTurnCount}</span>
        )}
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function ChatTimeline({ messages, classifications, selectedId, highlightCode, onSelect, cctAnalysis }: Props) {
  const classMap = new Map(classifications?.map((c) => [c.messageId, c]));

  // CCT maps
  const msgEpisode = new Map<string, Episode>();
  const episodeFirstMsg = new Map<string, Episode>(); // first msgId → episode
  const msgIsSubstantive = new Map<string, boolean>();
  const msgCCTId = new Map<string, string>();

  if (cctAnalysis) {
    cctAnalysis.episodes.forEach((ep) => {
      if (ep.messageIds.length > 0) {
        episodeFirstMsg.set(ep.messageIds[0], ep);
      }
      ep.messageIds.forEach((mid) => msgEpisode.set(mid, ep));
    });
    cctAnalysis.turns.forEach((t) => {
      t.messageIds.forEach((mid) => msgIsSubstantive.set(mid, t.isSubstantive ?? false));
    });
    cctAnalysis.ccoTurns.forEach((cct) => {
      cct.messageIds.forEach((mid) => {
        if (!msgCCTId.has(mid)) msgCCTId.set(mid, cct.id);
      });
    });
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-4">
        {messages.map((msg) => {
          const cls = classMap.get(msg.id);
          const dimmed = !!highlightCode && cls?.code !== highlightCode;
          const episodeHeader = episodeFirstMsg.get(msg.id);
          const isSubstantive = cctAnalysis ? msgIsSubstantive.get(msg.id) : undefined;
          const cctId = msgCCTId.get(msg.id);
          return (
            <React.Fragment key={msg.id}>
              {episodeHeader && <EpisodeHeader episode={episodeHeader} />}
              <ChatMessageItem
                message={msg}
                classification={cls}
                isSelected={selectedId === msg.id}
                dimmed={dimmed}
                isSubstantive={isSubstantive}
                cctId={cctId}
                onClick={() => onSelect?.(msg.id)}
              />
            </React.Fragment>
          );
        })}
      </div>
    </ScrollArea>
  );
}
