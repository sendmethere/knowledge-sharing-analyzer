"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  {
    id: "turn",
    label: "Turn",
    labelKo: "발화 순서",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    description: "단일 화자의 연속 발화 묶음 (Traum & Heeman, 1997). 같은 화자가 연속으로 메시지를 보내면 하나의 Turn으로 간주합니다.",
    signals: [
      "A가 메시지 3개를 연속 전송 → Turn 1개로 병합",
      "화자가 바뀌면 새 Turn 시작",
    ],
    example: "A: '이게 뭔지 알아?' / A: '나는 잘 모르겠어' → Turn 1개 (A)",
  },
  {
    id: "substantive",
    label: "Substantive",
    labelKo: "실질적 발언",
    color: "bg-green-100 text-green-800 border-green-300",
    description: "학습 자료의 개념에 관련된 질문이나 설명. 발언의 정확성은 무관하며 학습 주제와의 관련성만 판단합니다.",
    signals: [
      "학습 주제 관련 개념·질문·설명·주장·예시 → 실질적",
      "'ㅇㅇ', '맞아', 'ㅎㅎ', 단순 감탄사 → 비실질적",
      "정확하지 않아도 주제와 관련되면 실질적",
    ],
    example: "실질: '에이전틱 AI가 자율적으로 도구를 쓰는 게 핵심 아니야?' / 비실질: 'ㅇㅇ ㅋㅋ'",
  },
  {
    id: "episode",
    label: "Interaction Episode",
    labelKo: "상호작용 에피소드",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    description: "동일 주제에 대한 연속 발화 묶음(에피소드) 중, 서로 다른 2명 이상이 각각 최소 1개의 실질적 발언을 교환한 경우.",
    signals: [
      "에피소드: 주제가 바뀌면 새 에피소드로 분리",
      "IE 성립 조건: A와 B 모두 실질적 발언 포함",
      "한 화자만 실질 발언하면 IE 아님",
    ],
    example: "A: '설계 기반 학습과 어떻게 연결돼?' (실질) → B: '학생이 직접 AI 도구 설계하면 되지' (실질) → IE 성립",
  },
  {
    id: "cct",
    label: "Co-Constructive Turn",
    labelKo: "공동구성적 턴",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Interaction Episode 내에서 화자 교체(speaker change)가 발생할 때, 교체 전후 두 화자 모두 실질적 발언을 포함하는 연속 발화 쌍.",
    signals: [
      "IE 안에서만 발생 가능",
      "화자 교체 시점에 양측 모두 실질적 발언이어야 함",
      "한쪽이 '맞아', '그렇구나' 등 비실질이면 CCT 불성립",
    ],
    example: "A: 'TKS 루브릭에서 integration이 가장 핵심이지' (실질) → B: '맞는데 elicitation이 없으면 integration도 안 나오더라' (실질) → CCT 1개",
  },
];

const METRICS = [
  { label: "에피소드 수", desc: "주제 전환 단위로 나눈 대화 구간 수" },
  { label: "IE 수 (Interaction Episode)", desc: "양측이 실질 발언을 교환한 에피소드 수" },
  { label: "실질적 발화 수", desc: "Turn 중 학습 주제와 관련된 발화 수" },
  { label: "IE당 CCT 수", desc: "핵심 지표. 상호작용 에피소드 1개당 평균 공동구성적 턴 수. 높을수록 지식 공동구성이 활발함" },
];

export function CCTExplainer({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isOpen = alwaysOpen || open;

  return (
    <div className="border rounded-lg overflow-hidden">
      {!alwaysOpen && (
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <span>CCT 판단 기준</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      )}

      {isOpen && (
        <div className="divide-y">
          {LEVELS.map((level) => {
            const isExpanded = expanded === level.id;
            return (
              <div key={level.id}>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : level.id)}
                >
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium border", level.color)}>
                    {level.label}
                  </span>
                  <span className="text-xs text-gray-500 flex-1">{level.labelKo}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 bg-gray-50">
                    <p className="text-xs text-gray-600">{level.description}</p>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">판단 신호</p>
                      <ul className="space-y-0.5">
                        {level.signals.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">예시</p>
                      <p className="text-xs text-gray-500 italic">{level.example}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="px-4 py-3 bg-teal-50">
            <p className="text-xs font-medium text-teal-700 mb-2">측정 지표</p>
            <ul className="space-y-1.5">
              {METRICS.map((m) => (
                <li key={m.label} className="text-xs text-teal-800">
                  <span className="font-medium">{m.label}:</span>{" "}
                  <span className="text-teal-700">{m.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
