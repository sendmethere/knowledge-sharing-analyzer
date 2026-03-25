export type RubricCode =
  | "no_reaction"
  | "externalization"
  | "acceptance"
  | "elicitation"
  | "integration"
  | "conflict";

export type ConflictSubtype = "rejection" | "replacement" | "amendment";

export interface ChatMessage {
  id: string;
  speaker: "A" | "B";
  text: string;
  timestamp?: string;
  parentId?: string;
}

export interface ClassificationResult {
  messageId: string;
  code: RubricCode;
  subtype?: ConflictSubtype;
  confidence: number;
  reasoning: string;
  alternativeCode?: RubricCode;
  alternativeConfidence?: number;
  needsReview: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  topic: string;
  chatHistory: ChatMessage[];
}

export interface AnalysisSummary {
  scenarioId: string;
  totalMessages: number;
  codeDistribution: Record<RubricCode, number>;
  cognitiveConflictDensity: number;
  interactionQuality: "low" | "medium" | "high";
  insights: string[];
  classifiedMessages: ClassificationResult[];
}
