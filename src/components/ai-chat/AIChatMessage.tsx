"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function AIChatMessage({ role, content, isStreaming }: Props) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2 text-sm", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
        isUser ? "bg-blue-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
      )}>
        {content}
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm align-middle" />}
      </div>
    </div>
  );
}
