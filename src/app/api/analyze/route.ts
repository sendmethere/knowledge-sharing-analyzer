import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  CLASSIFICATION_PARAMS,
  NEEDS_REVIEW_THRESHOLD,
  buildClassificationUserPrompt,
} from "@/lib/prompts";
import { ChatMessage, ClassificationResult } from "@/lib/types";

async function classifyMessage(
  openai: OpenAI,
  target: ChatMessage,
  context: Array<{ id: string; speaker: string; text: string }>
): Promise<ClassificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: CLASSIFICATION_PARAMS.model,
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildClassificationUserPrompt(
            { id: target.id, speaker: target.speaker, text: target.text },
            context
          ),
        },
      ],
      temperature: CLASSIFICATION_PARAMS.temperature,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(
      response.choices[0].message.content ?? "{}"
    ) as ClassificationResult;

    return {
      ...parsed,
      messageId: target.id,
      needsReview: parsed.confidence < NEEDS_REVIEW_THRESHOLD,
    };
  } catch {
    return {
      messageId: target.id,
      code: "externalization",
      confidence: 0,
      reasoning: "분류 실패",
      needsReview: true,
    };
  }
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages }: { messages: ChatMessage[] } = await req.json();
  const contextWindow = CLASSIFICATION_PARAMS.context_window;

  // 모든 메시지를 병렬로 분류 (순차 → 동시 실행으로 속도 대폭 향상)
  const tasks = messages.map((target, i) => {
    const context = messages
      .slice(Math.max(0, i - contextWindow), i)
      .map((m) => ({ id: m.id, speaker: m.speaker, text: m.text }));
    return classifyMessage(openai, target, context);
  });

  const results = await Promise.all(tasks);

  return NextResponse.json({ results });
}
