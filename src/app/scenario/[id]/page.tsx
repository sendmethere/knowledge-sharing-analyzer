"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatTimeline } from "@/components/chat/ChatTimeline";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { AIChatFloat } from "@/components/ai-chat/AIChatFloat";
import { getScenarioById } from "@/lib/scenarios";
import { useAnalysis } from "@/hooks/useAnalysis";

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const scenario = getScenarioById(id);
  if (!scenario) notFound();

  const [selectedMsgId, setSelectedMsgId] = useState<string | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { analysis, isLoading, error, analyze } = useAnalysis(scenario.id);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-sm">{scenario.title}</h1>
            <p className="text-xs text-gray-400">{scenario.chatHistory.length}개 발화</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isChatOpen ? "default" : "outline"}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI 대화
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Selected message detail */}
          {selectedMsgId && analysis && (
            <div className="bg-blue-50 border-b px-4 py-2">
              {(() => {
                const result = analysis.classifiedMessages.find(
                  (c) => c.messageId === selectedMsgId
                );
                if (!result) return null;
                return (
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-blue-800">분류 근거</p>
                    <p className="text-blue-700">{result.reasoning}</p>
                    {result.alternativeCode && (
                      <p className="text-blue-500">
                        대안 코드: {result.alternativeCode} ({Math.round((result.alternativeConfidence ?? 0) * 100)}%)
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          <div className="flex-1 overflow-hidden min-h-0">
            <ChatTimeline
              messages={scenario.chatHistory}
              classifications={analysis?.classifiedMessages}
              selectedId={selectedMsgId}
              onSelect={setSelectedMsgId}
            />
          </div>
        </div>

        {/* Analysis Sidebar */}
        <aside className="w-72 border-l bg-white overflow-y-auto p-4 hidden lg:block flex-shrink-0">
          <AnalysisPanel
            analysis={analysis}
            isLoading={isLoading}
            error={error}
            onAnalyze={analyze}
            messages={scenario.chatHistory}
          />
        </aside>
      </div>

      {/* Mobile Analysis Button */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        {!analysis && !isLoading && (
          <Button
            className="flex-1"
            onClick={() => analyze(scenario.chatHistory)}
          >
            분석 시작
          </Button>
        )}
        {isLoading && (
          <Button className="flex-1" disabled>
            분석 중…
          </Button>
        )}
      </div>

      {/* AI Chat Float */}
      <AIChatFloat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        scenarioTitle={scenario.title}
        scenarioTopic={scenario.topic}
        analysis={analysis}
      />
    </div>
  );
}
