"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MessageSquare, X, Trash2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIChatMessage } from "./AIChatMessage";
import { AIChatInput } from "./AIChatInput";
import { useAIChat } from "@/hooks/useAIChat";
import { AnalysisSummary } from "@/lib/types";
import { CODE_ORDER, RUBRIC } from "@/lib/rubric";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenarioTitle: string;
  scenarioTopic: string;
  analysis: AnalysisSummary | null;
}

function buildAnalysisSummaryText(analysis: AnalysisSummary | null): string {
  if (!analysis) return "분석 결과 없음";
  const lines = [
    `전체 발화: ${analysis.totalMessages}개`,
    `상호작용 품질: ${analysis.interactionQuality}`,
    `인지적 갈등 밀도: ${Math.round(analysis.cognitiveConflictDensity * 100)}%`,
    "",
    "코드 분포:",
    ...CODE_ORDER.map((code) => {
      const def = RUBRIC[code];
      const count = analysis.codeDistribution[code] || 0;
      return `  - ${def.label}(${def.labelKo}): ${count}개`;
    }),
    "",
    "인사이트:",
    ...analysis.insights.map((i) => `  - ${i}`),
  ];
  return lines.join("\n");
}

export function AIChatFloat({ isOpen, onClose, scenarioTitle, scenarioTopic, analysis }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize position after mount (avoid SSR window access)
  useEffect(() => {
    setPos({
      x: Math.max(0, window.innerWidth - 420),
      y: 80,
    });
    setInitialized(true);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const scenarioContext = {
    title: scenarioTitle,
    topic: scenarioTopic,
    analysis: buildAnalysisSummaryText(analysis),
  };

  const { messages, isStreaming, error, sendMessage, clearMessages, stopStreaming } =
    useAIChat(scenarioContext);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen || !initialized) return null;

  return (
    <div
      className="fixed z-50 flex flex-col bg-white rounded-xl shadow-2xl border w-[380px]"
      style={{
        left: pos.x,
        top: pos.y,
        height: "520px",
      }}
    >
      {/* Drag handle / header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b cursor-grab active:cursor-grabbing select-none rounded-t-xl bg-gray-50"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-gray-400" />
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">AI 분석 대화</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearMessages}
            title="대화 초기화"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-8 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-gray-200" />
              <p>분석 결과에 대해 질문해보세요.</p>
              {!analysis && (
                <p className="text-xs text-amber-500">먼저 분석을 실행하면 더 정확한 답변을 받을 수 있습니다.</p>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <AIChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <AIChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
    </div>
  );
}
