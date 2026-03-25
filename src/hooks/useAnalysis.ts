import { useState, useCallback, useEffect } from "react";
import { AnalysisSummary, ChatMessage, RubricCode } from "@/lib/types";

const CACHE_KEY = (id: string) => `tks_analysis_${id}`;

export function useAnalysis(scenarioId: string) {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시 로드 (마운트 시)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY(scenarioId));
      if (cached) setAnalysis(JSON.parse(cached));
    } catch {
      // localStorage 접근 불가 환경 무시
    }
  }, [scenarioId]);

  const analyze = useCallback(async (messages: ChatMessage[], force = false) => {
    // 강제 재분석이 아니면 캐시 확인
    if (!force) {
      try {
        const cached = localStorage.getItem(CACHE_KEY(scenarioId));
        if (cached) {
          setAnalysis(JSON.parse(cached));
          return;
        }
      } catch {
        // ignore
      }
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error("분석 요청 실패");
      const { results } = await res.json();

      const distribution: Record<RubricCode, number> = {
        no_reaction: 0,
        externalization: 0,
        acceptance: 0,
        elicitation: 0,
        integration: 0,
        conflict: 0,
      };
      results.forEach((r: { code: RubricCode }) => {
        distribution[r.code] = (distribution[r.code] || 0) + 1;
      });

      const total = results.length;
      const cognitiveConflictDensity =
        ((distribution.integration + distribution.conflict) / total) || 0;

      const quality =
        cognitiveConflictDensity >= 0.4
          ? "high"
          : cognitiveConflictDensity >= 0.2
          ? "medium"
          : "low";

      const insights: string[] = [];
      if (distribution.integration > 0)
        insights.push(`${distribution.integration}개의 발화에서 지식 통합이 일어났습니다.`);
      if (distribution.conflict > 0)
        insights.push(`${distribution.conflict}개의 건설적 갈등이 발견되었습니다.`);
      if (distribution.elicitation > 0)
        insights.push(`${distribution.elicitation}번의 유도 질문이 대화를 이끌었습니다.`);
      if (cognitiveConflictDensity < 0.2)
        insights.push("통합·갈등 비율이 낮습니다. 더 깊은 토론을 유도해보세요.");

      const summary: AnalysisSummary = {
        scenarioId,
        totalMessages: total,
        codeDistribution: distribution,
        cognitiveConflictDensity,
        interactionQuality: quality,
        insights,
        classifiedMessages: results,
      };

      try {
        localStorage.setItem(CACHE_KEY(scenarioId), JSON.stringify(summary));
      } catch {
        // localStorage 용량 초과 등 무시
      }
      setAnalysis(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);

  return { analysis, isLoading, error, analyze };
}
