"use client";

import { RUBRIC, CODE_ORDER } from "@/lib/rubric";
import { RubricCode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  distribution: Record<RubricCode, number>;
  total: number;
}

export function CodeDistributionChart({ distribution, total }: Props) {
  return (
    <div className="space-y-2">
      {CODE_ORDER.map((code) => {
        const count = distribution[code] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const def = RUBRIC[code];
        return (
          <div key={code} className="flex items-center gap-2 text-sm">
            <span className={cn("w-24 text-xs font-medium", def.textColor)}>
              {def.labelKo}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all", def.color.replace("bg-", "bg-").replace("-100", "-400"))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-gray-500">{count}</span>
            <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
