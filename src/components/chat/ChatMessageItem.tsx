"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBadge } from "./CodeBadge";
import { RUBRIC } from "@/lib/rubric";

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
  message: ChatMsg;
  classification?: ClassResult;
  isSelected?: boolean;
  dimmed?: boolean;
  isSubstantive?: boolean;
  cctId?: string;
  onClick?: () => void;
}

export function ChatMessageItem({ message, classification, isSelected, dimmed, isSubstantive, cctId, onClick }: Props) {
  const isA = message.speaker === "A";
  const rubricDef = classification ? RUBRIC[classification.code as keyof typeof RUBRIC] : null;

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
        isA ? "flex-row" : "flex-row-reverse",
        isSelected ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50",
        dimmed && "grayscale opacity-30",
        cctId && "bg-amber-50/50"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
          isA ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
        )}
      >
        {message.speaker}
      </div>
      <div className={cn("flex flex-col gap-1 max-w-[75%]", isA ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isA
              ? "bg-white border border-gray-200 rounded-tl-sm"
              : "bg-blue-500 text-white rounded-tr-sm"
          )}
        >
          {message.text}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {classification && rubricDef && (
            <CodeBadge
              code={classification.code}
              rubricDef={rubricDef}
              showLabel="both"
              size="sm"
              confidence={classification.confidence}
            />
          )}
          {cctId && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              {cctId.replace("cct-", "CCT #")}
            </span>
          )}
          {isSubstantive === false && (
            <span className="text-xs text-gray-400">비실질</span>
          )}
          {classification?.needsReview && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      </div>
    </div>
  );
}
