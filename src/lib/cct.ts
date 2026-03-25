import { ChatMessage, Turn, Episode, CCoTurn, CCTAnalysis } from "./types";

export function mergeTurns(messages: ChatMessage[]): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | null = null;
  messages.forEach((msg) => {
    if (!current || current.speaker !== msg.speaker) {
      if (current) turns.push(current);
      current = {
        id: `turn-${turns.length + 1}`,
        speaker: msg.speaker as "A" | "B",
        messageIds: [msg.id],
        combinedText: msg.text,
      };
    } else {
      current.messageIds.push(msg.id);
      current.combinedText += " " + msg.text;
    }
  });
  if (current) turns.push(current);
  return turns;
}

export function buildCCTAnalysis(
  turns: Turn[],
  episodeGroups: { turnIds: string[]; topicLabel: string }[]
): CCTAnalysis {
  const turnMap = new Map(turns.map((t) => [t.id, t]));

  const episodes: Episode[] = episodeGroups.map((group, i) => {
    const epTurns = group.turnIds.map((id) => turnMap.get(id)).filter(Boolean) as Turn[];
    const messageIds = epTurns.flatMap((t) => t.messageIds);

    const substantiveSpeakers = new Set(
      epTurns.filter((t) => t.isSubstantive).map((t) => t.speaker)
    );
    const isIE = substantiveSpeakers.size >= 2;

    let ccoTurnCount = 0;
    for (let j = 0; j < epTurns.length - 1; j++) {
      const a = epTurns[j];
      const b = epTurns[j + 1];
      if (a.speaker !== b.speaker && a.isSubstantive && b.isSubstantive) {
        ccoTurnCount++;
      }
    }

    return {
      id: `ep-${i + 1}`,
      topicLabel: group.topicLabel,
      turnIds: group.turnIds,
      messageIds,
      isInteractionEpisode: isIE,
      ccoTurnCount,
    };
  });

  const ccoTurns: CCoTurn[] = [];
  let cctIdx = 1;
  episodes.forEach((ep) => {
    if (!ep.isInteractionEpisode) return;
    const epTurns = ep.turnIds.map((id) => turnMap.get(id)).filter(Boolean) as Turn[];
    for (let j = 0; j < epTurns.length - 1; j++) {
      const a = epTurns[j];
      const b = epTurns[j + 1];
      if (a.speaker !== b.speaker && a.isSubstantive && b.isSubstantive) {
        ccoTurns.push({
          id: `cct-${cctIdx++}`,
          episodeId: ep.id,
          messageIds: [...a.messageIds, ...b.messageIds],
        });
      }
    }
  });

  const totalSubstantiveComments = turns.filter((t) => t.isSubstantive).length;
  const ieEpisodes = episodes.filter((e) => e.isInteractionEpisode);
  const totalIE = ieEpisodes.length;
  const substantiveInIE = ieEpisodes.reduce((sum, ep) => {
    return sum + ep.turnIds.filter((id) => turnMap.get(id)?.isSubstantive).length;
  }, 0);

  return {
    turns,
    episodes,
    ccoTurns,
    totalSubstantiveComments,
    totalInteractionEpisodes: totalIE,
    substantivePerIE: totalIE > 0 ? substantiveInIE / totalIE : 0,
    ccoTurnsPerIE: totalIE > 0 ? ccoTurns.length / totalIE : 0,
  };
}
