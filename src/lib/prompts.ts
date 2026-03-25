import classificationConfig from "@/config/prompts/classification.json";
import aiChatConfig from "@/config/prompts/ai-chat.json";

export const CLASSIFICATION_SYSTEM_PROMPT: string = classificationConfig.system;

export const CLASSIFICATION_PARAMS = classificationConfig.parameters;

export const NEEDS_REVIEW_THRESHOLD: number = classificationConfig.needs_review_threshold;

export function buildClassificationUserPrompt(
  targetMessage: { id: string; speaker: string; text: string },
  context: Array<{ id: string; speaker: string; text: string; code?: string }>
): string {
  const contextText = context
    .map(
      (m) =>
        `[${m.id}] ${m.speaker}: "${m.text}"${m.code ? ` (분류: ${m.code})` : ""}`
    )
    .join("\n");

  return classificationConfig.user_template
    .replace("{context_count}", String(context.length))
    .replace("{context}", contextText)
    .replace("{message_id}", targetMessage.id)
    .replace("{speaker}", targetMessage.speaker)
    .replace("{text}", targetMessage.text);
}

export const AI_CHAT_PARAMS = aiChatConfig.parameters;

export function buildAIChatSystemPrompt(scenario: {
  title: string;
  topic: string;
  analysis: string;
}): string {
  return aiChatConfig.system_template
    .replace("{scenario_title}", scenario.title)
    .replace("{scenario_topic}", scenario.topic)
    .replace("{analysis_summary}", scenario.analysis);
}
