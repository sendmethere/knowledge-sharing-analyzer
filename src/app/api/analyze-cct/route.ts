import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatMessage } from "@/lib/types";
import { mergeTurns, buildCCTAnalysis } from "@/lib/cct";
import { Turn } from "@/lib/types";
import cctConfig from "@/config/prompts/cct.json";

async function classifySubstantive(openai: OpenAI, turns: Turn[], topic: string) {
  const turnsList = turns.map((t) => `[${t.id}] ${t.speaker}: "${t.combinedText}"`).join("\n");
  const userMsg = cctConfig.substantive_user_template
    .replace("{topic}", topic)
    .replace("{turns_list}", turnsList);
  const res = await openai.chat.completions.create({
    model: cctConfig.parameters.model,
    messages: [
      { role: "system", content: cctConfig.substantive_system },
      { role: "user", content: userMsg },
    ],
    temperature: cctConfig.parameters.temperature,
    response_format: { type: "json_object" },
  });
  const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
  return (parsed.results ?? []) as { turnId: string; isSubstantive: boolean }[];
}

async function segmentEpisodes(openai: OpenAI, turns: Turn[]) {
  const turnsList = turns
    .map((t) => `[${t.id}] ${t.speaker}: "${t.combinedText}"`)
    .join("\n");
  const userMsg = cctConfig.segmentation_user_template.replace("{turns_list}", turnsList);
  const res = await openai.chat.completions.create({
    model: cctConfig.parameters.model,
    messages: [
      { role: "system", content: cctConfig.segmentation_system },
      { role: "user", content: userMsg },
    ],
    temperature: cctConfig.parameters.temperature,
    response_format: { type: "json_object" },
  });
  const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
  return (parsed.episodes ?? []) as { turnIds: string[]; topicLabel: string }[];
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages, topic }: { messages: ChatMessage[]; topic: string } = await req.json();

  const turns = mergeTurns(messages);

  // Run both LLM calls in parallel to stay within Netlify function timeout
  const [substResults, episodeGroups] = await Promise.all([
    classifySubstantive(openai, turns, topic),
    segmentEpisodes(openai, turns),
  ]);

  const turnMap = new Map(turns.map((t) => [t.id, t]));
  substResults.forEach(({ turnId, isSubstantive }) => {
    const t = turnMap.get(turnId);
    if (t) t.isSubstantive = isSubstantive;
  });

  // Fallback: if LLM returns empty, treat whole conversation as one episode
  const groups =
    episodeGroups.length > 0
      ? episodeGroups
      : [{ turnIds: turns.map((t) => t.id), topicLabel: "전체 대화" }];

  const cctAnalysis = buildCCTAnalysis(turns, groups);
  return NextResponse.json({ cctAnalysis });
}
