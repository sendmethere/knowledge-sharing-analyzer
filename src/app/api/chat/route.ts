import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildAIChatSystemPrompt, AI_CHAT_PARAMS } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages, scenarioContext } = await req.json();

  const stream = await openai.chat.completions.create({
    model: AI_CHAT_PARAMS.model,
    messages: [
      { role: "system", content: buildAIChatSystemPrompt(scenarioContext) },
      ...messages,
    ],
    stream: true,
    temperature: AI_CHAT_PARAMS.temperature,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
