"use client";

import { useState } from "react";
import { RUBRIC, CODE_ORDER } from "@/lib/rubric";
import { RubricCode } from "@/lib/types";

interface Props {
  distribution: Record<RubricCode, number>;
  total: number;
  highlightCode?: RubricCode | null;
  onHighlightCode?: (code: RubricCode | null) => void;
}

// 명확한 색상 팔레트 (Tailwind 동적 클래스 대신 인라인 스타일)
const COLORS: Record<RubricCode, string> = {
  no_reaction:     "#9ca3af", // gray-400
  externalization: "#60a5fa", // blue-400
  acceptance:      "#4ade80", // green-400
  elicitation:     "#fbbf24", // amber-400
  integration:     "#c084fc", // purple-400
  conflict:        "#fb923c", // orange-400
};

// SVG 파이 차트 경로 계산
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function PieChart({ distribution, total, highlightCode, onHighlightCode }: Props) {
  const [hovered, setHovered] = useState<RubricCode | null>(null);

  const segments = CODE_ORDER.map((code) => ({
    code,
    count: distribution[code] || 0,
    pct: total > 0 ? (distribution[code] || 0) / total : 0,
    def: RUBRIC[code],
    color: COLORS[code],
  })).filter((s) => s.count > 0);

  let currentAngle = 0;
  const arcs = segments.map((seg) => {
    const startAngle = currentAngle;
    const sweep = seg.pct * 360;
    currentAngle += sweep;
    return { ...seg, startAngle, endAngle: currentAngle };
  });

  const cx = 80;
  const cy = 80;
  const r = 65;
  const rHovered = 70;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {arcs.map((arc) => (
          <path
            key={arc.code}
            d={describeArc(
              cx, cy,
              hovered === arc.code ? rHovered : r,
              arc.startAngle,
              arc.endAngle
            )}
            fill={arc.color}
            stroke="white"
            strokeWidth="1.5"
            style={{
              cursor: "pointer",
              transition: "d 0.15s",
              opacity: highlightCode && highlightCode !== arc.code ? 0.3 : 1,
            }}
            onMouseEnter={() => setHovered(arc.code)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onHighlightCode?.(highlightCode === arc.code ? null : arc.code)}
          />
        ))}
        {/* 중앙 텍스트 */}
        {hovered ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="600">
              {RUBRIC[hovered].labelKo}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fill="#111827" fontWeight="700">
              {distribution[hovered] || 0}개
            </text>
            <text x={cx} y={cy + 24} textAnchor="middle" fontSize="11" fill="#6b7280">
              {total > 0 ? Math.round(((distribution[hovered] || 0) / total) * 100) : 0}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#6b7280">전체</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="15" fill="#111827" fontWeight="700">
              {total}개
            </text>
          </>
        )}
      </svg>

      {/* 범례 */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full">
        {arcs.map((arc) => {
          const isHighlighted = highlightCode === arc.code;
          return (
            <div
              key={arc.code}
              className={`flex items-center gap-1.5 text-xs cursor-pointer rounded px-1 py-0.5 transition-all ${
                isHighlighted ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
              } ${highlightCode && !isHighlighted ? "opacity-40" : ""}`}
              onMouseEnter={() => setHovered(arc.code)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onHighlightCode?.(isHighlighted ? null : arc.code)}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <span className={`truncate ${hovered === arc.code || isHighlighted ? "font-semibold" : "text-gray-600"}`}>
                {arc.def.labelKo}
              </span>
              <span className="ml-auto text-gray-400 flex-shrink-0">{arc.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChart({ distribution, total, highlightCode, onHighlightCode }: Props) {
  return (
    <div className="space-y-2">
      {CODE_ORDER.map((code) => {
        const count = distribution[code] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const def = RUBRIC[code];
        const isHighlighted = highlightCode === code;
        const isDimmed = !!highlightCode && !isHighlighted;
        return (
          <div
            key={code}
            className={`flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 transition-all ${
              isHighlighted ? "bg-gray-100" : "hover:bg-gray-50"
            } ${isDimmed ? "opacity-30" : ""}`}
            onClick={() => onHighlightCode?.(isHighlighted ? null : code)}
          >
            <span className={`w-14 text-xs font-medium truncate ${isHighlighted ? "text-gray-800" : "text-gray-600"}`}>
              {def.labelKo}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: COLORS[code] }}
              />
            </div>
            <span className="w-5 text-right text-xs font-medium text-gray-700">{count}</span>
            <span className="w-9 text-right text-xs text-gray-400">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function CodeDistributionChart({ distribution, total, highlightCode, onHighlightCode }: Props) {
  const [view, setView] = useState<"bar" | "pie">("bar");

  return (
    <div className="space-y-3">
      {/* 토글 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(["bar", "pie"] as const).map((v) => (
          <button
            key={v}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              view === v
                ? "bg-white shadow-sm font-medium text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setView(v)}
          >
            {v === "bar" ? "막대" : "원형"}
          </button>
        ))}
      </div>

      {view === "bar" ? (
        <BarChart distribution={distribution} total={total} highlightCode={highlightCode} onHighlightCode={onHighlightCode} />
      ) : (
        <PieChart distribution={distribution} total={total} highlightCode={highlightCode} onHighlightCode={onHighlightCode} />
      )}
    </div>
  );
}
