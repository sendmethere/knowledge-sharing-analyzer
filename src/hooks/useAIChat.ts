import { useState, useCallback, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ScenarioContext {
  title: string;
  topic: string;
  analysis: string;
}

export function useAIChat(scenarioContext: ScenarioContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userInput: string) => {
    const userMsg: Message = { role: "user", content: userInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);
    setError(null);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, scenarioContext }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("AI 대화 요청 실패");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다");

      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([
          ...newMessages,
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
        setMessages(newMessages);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, scenarioContext]);

  const clearMessages = useCallback(() => setMessages([]), []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages, stopStreaming };
}
