"use client";

import { BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeDistributionChart } from "./CodeDistributionChart";
import { InsightCard } from "./InsightCard";
import { RubricExplainer } from "./RubricExplainer";
import { AnalysisSummary, ChatMessage } from "@/lib/types";

interface Props {
  analysis: AnalysisSummary | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: (messages: ChatMessage[], force?: boolean) => void;
  messages: ChatMessage[];
}

export function AnalysisPanel({ analysis, isLoading, error, onAnalyze, messages }: Props) {
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">코드 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeDistributionChart
                distribution={analysis.codeDistribution}
                total={analysis.totalMessages}
              />
            </CardContent>
          </Card>

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
    </div>
  );
}
