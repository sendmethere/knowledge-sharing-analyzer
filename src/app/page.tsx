import { SCENARIOS } from "@/lib/scenarios";
import { ScenarioCard } from "@/components/scenario/ScenarioCard";
import { BookOpen } from "lucide-react";
import { CCTExplainer } from "@/components/analysis/CCTExplainer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transactive Knowledge Sharing
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            초등학교 학습자 간 채팅 대화를 Noroozi et al. 루브릭으로 분류하고
            AI와 함께 심화 분석합니다.
          </p>
        </div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              id={scenario.id}
              title={scenario.title}
              description={scenario.description}
              topic={scenario.topic}
              messageCount={scenario.chatHistory.length}
            />
          ))}
        </div>

        {/* Rubric Legend */}
        <div className="mt-12 p-5 bg-white rounded-xl border">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">루브릭 코드 안내</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { code: "No Reaction · 무반응", color: "bg-gray-100 text-gray-700 border-gray-300", desc: "이전 발화를 참조하지 않음" },
              { code: "Externalization · 외재화", color: "bg-blue-100 text-blue-800 border-blue-300", desc: "독립적으로 지식 서술" },
              { code: "Acceptance · 수용", color: "bg-green-100 text-green-800 border-green-300", desc: "수정 없이 동의" },
              { code: "Elicitation · 유도", color: "bg-amber-100 text-amber-800 border-amber-300", desc: "파트너 반응 요청" },
              { code: "Integration · 통합", color: "bg-purple-100 text-purple-800 border-purple-300", desc: "복수 관점 종합" },
              { code: "Conflict · 갈등", color: "bg-orange-100 text-orange-800 border-orange-300", desc: "거부·대체·수정" },
            ].map((item) => (
              <div key={item.code} className={`rounded-lg px-3 py-2 border ${item.color}`}>
                <div className="font-medium">{item.code}</div>
                <div className="opacity-70 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CCT Explainer */}
        <div className="mt-4">
          <CCTExplainer alwaysOpen />
        </div>
      </div>
    </main>
  );
}
