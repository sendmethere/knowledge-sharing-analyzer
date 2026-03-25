"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RUBRIC, CODE_ORDER } from "@/lib/rubric";
import { cn } from "@/lib/utils";

const CRITERIA: Record<string, { signals: string[]; example: string }> = {
  no_reaction: {
    signals: [
      "이전 발화 내용과 완전히 무관한 응답",
      "갑작스러운 주제 전환",
      "형식적 인사나 단순 응답 반복",
    ],
    example: "B: 탄소 배출 줄여야 해. → A: 오늘 점심 뭐 먹었어?",
  },
  externalization: {
    signals: [
      "이전 메시지 참조 없이 자신의 의견·지식 독립 서술",
      "새로운 논거나 사실 제시",
      "스레드 첫 발화 또는 병렬 주장",
    ],
    example: "A: 나는 분리수거가 가장 중요하다고 생각해.",
  },
  acceptance: {
    signals: [
      "'맞아', '동의해', '그렇지' 등 단순 동의",
      "상대 내용을 수정 없이 반복·확인",
      "새로운 정보나 반론 없이 수용",
    ],
    example: "B: 재활용이 중요해. → A: 응, 맞아.",
  },
  elicitation: {
    signals: [
      "상대방 의견을 명시적으로 묻는 질문",
      "참여 초대 또는 제안",
      "암묵적으로 응답을 유도하는 표현",
    ],
    example: "A: 너는 어떻게 생각해? / 우리 이 주제로 더 얘기해볼까?",
  },
  integration: {
    signals: [
      "두 관점을 합쳐 새로운 주장 생성",
      "'우리가 말한 것처럼', '그러면 결국' 등 종합 표현",
      "인식 변화나 발전된 이해 표현",
    ],
    example: "A: 그러면 개인 실천과 제도가 함께 가야 한다는 거네.",
  },
  conflict: {
    signals: [
      "rejection: '아니야', '틀렸어' 등 명시적 거부",
      "replacement: 완전히 다른 주장으로 대체",
      "amendment: '맞는데, 하지만…' 부분 수정·보완",
    ],
    example: "B: 정부가 다 해야 해. → A: 아니, 개인 실천도 반드시 필요해.",
  },
};

export function RubricExplainer() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>루브릭 판단 기준</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {open && (
        <div className="divide-y">
          {CODE_ORDER.map((code) => {
            const def = RUBRIC[code];
            const criteria = CRITERIA[code];
            const isExpanded = expanded === code;

            return (
              <div key={code}>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : code)}
                >
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-xs font-medium border",
                      def.color, def.textColor, def.borderColor
                    )}
                  >
                    {def.label}
                  </span>
                  <span className="text-xs text-gray-500 flex-1">{def.labelKo}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 bg-gray-50">
                    <p className="text-xs text-gray-600">{def.description}</p>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">판단 신호</p>
                      <ul className="space-y-0.5">
                        {criteria.signals.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">예시</p>
                      <p className="text-xs text-gray-500 italic">{criteria.example}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
