"use client";

import { BarChart3, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeDistributionChart } from "./CodeDistributionChart";
import { InsightCard } from "./InsightCard";
import { RubricExplainer } from "./RubricExplainer";
import { CCTExplainer } from "./CCTExplainer";
import { AnalysisSummary, CCTAnalysis, ChatMessage, RubricCode } from "@/lib/types";
import { RUBRIC, CODE_ORDER } from "@/lib/rubric";

const COLORS: Record<RubricCode, string> = {
  no_reaction:     "#9ca3af",
  externalization: "#60a5fa",
  acceptance:      "#4ade80",
  elicitation:     "#fbbf24",
  integration:     "#c084fc",
  conflict:        "#fb923c",
};

function SpeakerDistribution({
  analysis,
  messages,
}: {
  analysis: AnalysisSummary;
  messages: ChatMessage[];
}) {
  const speakerMap = new Map(messages.map((m) => [m.id, m.speaker]));

  const bySpeaker: Record<"A" | "B", Record<RubricCode, number>> = {
    A: { no_reaction: 0, externalization: 0, acceptance: 0, elicitation: 0, integration: 0, conflict: 0 },
    B: { no_reaction: 0, externalization: 0, acceptance: 0, elicitation: 0, integration: 0, conflict: 0 },
  };
  const totalBySpeaker = { A: 0, B: 0 };

  analysis.classifiedMessages.forEach((c) => {
    const speaker = speakerMap.get(c.messageId) as "A" | "B" | undefined;
    if (!speaker) return;
    bySpeaker[speaker][c.code] = (bySpeaker[speaker][c.code] || 0) + 1;
    totalBySpeaker[speaker]++;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">학생별 발화 분포</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(["A", "B"] as const).map((speaker) => {
          const total = totalBySpeaker[speaker];
          const speakerColor = speaker === "A" ? "#3b82f6" : "#a855f7";
          return (
            <div key={speaker} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: speakerColor }}
                >
                  {speaker}
                </span>
                <span className="text-xs text-gray-500">{total}개 발화</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {CODE_ORDER.map((code) => {
                  const count = bySpeaker[speaker][code] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={code}
                      title={`${RUBRIC[code].labelKo}: ${count}개 (${Math.round(pct)}%)`}
                      style={{ width: `${pct}%`, backgroundColor: COLORS[code] }}
                      className="transition-all"
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {CODE_ORDER.map((code) => {
                  const count = bySpeaker[speaker][code] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={code} className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[code] }} />
                      {RUBRIC[code].labelKo} {count}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CCTCard({ cct }: { cct: CCTAnalysis }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-500" />
          Co-Constructive Turn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">에피소드</span>
          <span className="font-medium">{cct.episodes.length}개</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">상호작용 에피소드(IE)</span>
          <span className="font-medium">{cct.totalInteractionEpisodes}개</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">실질적 발화</span>
          <span className="font-medium">{cct.totalSubstantiveComments}개</span>
        </div>
        <div className="flex justify-between border-t pt-1.5 mt-1">
          <span className="text-gray-700 font-medium">IE당 CCT</span>
          <span className="font-bold text-teal-600">{cct.ccoTurnsPerIE.toFixed(1)}회</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">CCT 총계</span>
          <span className="font-medium">{cct.ccoTurns.length}개</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  analysis: AnalysisSummary | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: (messages: ChatMessage[], force?: boolean) => void;
  messages: ChatMessage[];
  highlightCode?: RubricCode | null;
  onHighlightCode?: (code: RubricCode | null) => void;
}

export function AnalysisPanel({ analysis, isLoading, error, onAnalyze, messages, highlightCode, onHighlightCode }: Props) {
  return (
    <div className="space-y-4">
      {!analysis && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">채팅 대화를 AI로 분석하여 루브릭 코드를 분류합니다.</p>
            <Button onClick={() => onAnalyze(messages)} className="w-full">
              분석 시작
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-500">
              {messages.length}개 발화를 분류하는 중…
            </p>
            <p className="text-xs text-gray-400">약 30-60초 소요됩니다</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onAnalyze(messages)}>
              재시도
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">전체 발화</span>
                <span className="font-medium">{analysis.totalMessages}개</span>
              </div>
            </CardContent>
          </Card>

          {analysis.cctAnalysis && <CCTCard cct={analysis.cctAnalysis} />}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">코드 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeDistributionChart
                distribution={analysis.codeDistribution}
                total={analysis.totalMessages}
                highlightCode={highlightCode}
                onHighlightCode={onHighlightCode}
              />
            </CardContent>
          </Card>

          <SpeakerDistribution analysis={analysis} messages={messages} />

          <InsightCard
            insights={analysis.insights}
            quality={analysis.interactionQuality}
            density={analysis.cognitiveConflictDensity}
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAnalyze(messages, true)}
          >
            재분석 (캐시 무시)
          </Button>
        </>
      )}

      <RubricExplainer />
      <CCTExplainer />
    </div>
  );
}
