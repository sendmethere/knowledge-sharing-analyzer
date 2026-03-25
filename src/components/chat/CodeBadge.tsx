"use client";

import { cn } from "@/lib/utils";

interface RubricDef {
  label: string;
  labelKo: string;
  color: string;
  textColor: string;
  borderColor: string;
}

interface Props {
  code: string;
  rubricDef: RubricDef;
  showLabel?: "en" | "ko" | "both";
  size?: "sm" | "md";
  confidence?: number;
}

export function CodeBadge({ code: _code, rubricDef, showLabel = "both", size = "md", confidence }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium border",
        rubricDef.color,
        rubricDef.textColor,
        rubricDef.borderColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {showLabel === "en" && rubricDef.label}
      {showLabel === "ko" && rubricDef.labelKo}
      {showLabel === "both" && `${rubricDef.label} · ${rubricDef.labelKo}`}
      {confidence !== undefined && (
        <span className="opacity-60 text-xs">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
