"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  insights: string[];
  quality: "low" | "medium" | "high";
  density: number;
}

const qualityLabel: Record<string, string> = {
  low: "기초",
  medium: "발전 중",
  high: "우수",
};

const qualityColor: Record<string, string> = {
  low: "text-red-600 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-green-600 bg-green-50",
};

export function InsightCard({ insights, quality, density }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          AI 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">상호작용 품질</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${qualityColor[quality]}`}>
            {qualityLabel[quality]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">인지적 갈등 밀도</span>
          <span className="text-xs font-mono text-gray-700">{Math.round(density * 100)}%</span>
        </div>
        <div className="border-t pt-2 space-y-1.5">
          {insights.map((insight, i) => (
            <p key={i} className="text-xs text-gray-600 flex gap-1.5">
              <span className="text-amber-500 mt-0.5">•</span>
              {insight}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
