import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  CLASSIFICATION_PARAMS,
  NEEDS_REVIEW_THRESHOLD,
  buildClassificationUserPrompt,
} from "@/lib/prompts";
import { ChatMessage, ClassificationResult } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json();
  const contextWindow = CLASSIFICATION_PARAMS.context_window;
  const results: ClassificationResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const target = messages[i];
    const context = messages
      .slice(Math.max(0, i - contextWindow), i)
      .map((m, idx) => ({
        id: m.id,
        speaker: m.speaker,
        text: m.text,
        code: results[Math.max(0, i - contextWindow) + idx]?.code,
      }));

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

      results.push({
        ...parsed,
        messageId: target.id,
        needsReview: parsed.confidence < NEEDS_REVIEW_THRESHOLD,
      });
    } catch {
      results.push({
        messageId: target.id,
        code: "externalization",
        confidence: 0,
        reasoning: "분류 실패",
        needsReview: true,
      });
    }
  }

  return NextResponse.json({ results });
}
