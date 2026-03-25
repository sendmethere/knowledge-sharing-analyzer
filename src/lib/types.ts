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

export interface Turn {
  id: string;
  speaker: "A" | "B";
  messageIds: string[];
  combinedText: string;
  isSubstantive?: boolean;
}

export interface Episode {
  id: string;
  topicLabel: string;
  turnIds: string[];
  messageIds: string[];
  isInteractionEpisode: boolean;
  ccoTurnCount: number;
}

export interface CCoTurn {
  id: string;
  episodeId: string;
  messageIds: string[];
}

export interface CCTAnalysis {
  turns: Turn[];
  episodes: Episode[];
  ccoTurns: CCoTurn[];
  totalSubstantiveComments: number;
  totalInteractionEpisodes: number;
  substantivePerIE: number;
  ccoTurnsPerIE: number;
}

export interface AnalysisSummary {
  scenarioId: string;
  totalMessages: number;
  codeDistribution: Record<RubricCode, number>;
  cognitiveConflictDensity: number;
  interactionQuality: "low" | "medium" | "high";
  insights: string[];
  classifiedMessages: ClassificationResult[];
  cctAnalysis?: CCTAnalysis;
}
