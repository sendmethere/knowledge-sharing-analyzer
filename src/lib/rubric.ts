import { RubricCode } from "./types";
import classificationConfig from "@/config/prompts/classification.json";

export interface RubricDefinition {
  code: RubricCode;
  label: string;
  labelKo: string;
  color: string;
  textColor: string;
  borderColor: string;
  description: string;
  confidenceBaseline: number;
}

const rawRubric = classificationConfig.rubric_codes;

export const RUBRIC: Record<RubricCode, RubricDefinition> = Object.fromEntries(
  Object.entries(rawRubric).map(([code, def]) => [
    code,
    {
      code: code as RubricCode,
      label: def.label,
      labelKo: def.label_ko,
      color: def.color,
      textColor: def.text_color,
      borderColor: def.border_color,
      description: def.description,
      confidenceBaseline: def.confidence_baseline,
    },
  ])
) as Record<RubricCode, RubricDefinition>;

export const CODE_ORDER: RubricCode[] = [
  "no_reaction",
  "externalization",
  "acceptance",
  "elicitation",
  "integration",
  "conflict",
];
