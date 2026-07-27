import { useCallback, useRef, useState } from "react";
import { askAlphaAsk } from "../lib/api";
import type { Conversation, Message, SubjectKey } from "../types";

interface UseChatOptions {
  isAuthenticated: boolean;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function useChat({ isAuthenticated, setConversations }: UseChatOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState<SubjectKey | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setSubject(undefined);
    textareaRef.current?.focus();
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setMessages([]);
  }, []);

  const handleStarterClick = useCallback((prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const question = draft.trim();
    if (!question || isThinking) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      subject,
      timestamp: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await askAlphaAsk(question, subject, nextMessages);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.content,
        annotations: response.annotations,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (isAuthenticated) {
        setConversations((prev) => {
          const title =
            question.slice(0, 48) + (question.length > 48 ? "…" : "");
          if (activeId) {
            return prev.map((c) =>
              c.id === activeId ? { ...c, title, updatedAt: Date.now() } : c
            );
          }
          const newConvo: Conversation = {
            id: crypto.randomUUID(),
            title,
            updatedAt: Date.now(),
            messages: [],
          };
          setActiveId(newConvo.id);
          return [newConvo, ...prev];
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "AlphaAsk couldn't reach the model just now. Try sending that again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [draft, isThinking, subject, messages, isAuthenticated, activeId, setConversations]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const resetThread = useCallback(() => {
    setMessages([]);
    setActiveId(null);
  }, []);

  return {
    activeId,
    messages,
    draft,
    setDraft,
    subject,
    setSubject,
    isThinking,
    textareaRef,
    startNewChat,
    openConversation,
    handleStarterClick,
    handleSend,
    handleKeyDown,
    resetThread,
  };
}
