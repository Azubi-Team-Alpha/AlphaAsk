import { useCallback, useRef, useState } from "react";
import { askAlphaAskStream, createSession } from "../lib/api";
import { generateUUID } from "../lib/utils";
import type { Conversation, Message, SubjectKey } from "../types";

interface AttachedFile {
  name: string;
  content: string;
}

interface UseChatOptions {
  isAuthenticated: boolean;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function useChat({ isAuthenticated, setConversations }: UseChatOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState<SubjectKey | undefined>(undefined);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setSubject(undefined);
    setAttachedFile(null);
    textareaRef.current?.focus();
  }, []);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setSessionId(id);
    setMessages([]);
  }, []);

  const handleStarterClick = useCallback((prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  }, []);

  const handleAttachFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setAttachedFile({ name: file.name, content: text });
    };
    reader.readAsText(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
  }, []);

  const handleSend = useCallback(async () => {
    const question = draft.trim();
    if (!question || isThinking) return;

    const userMessageContent = attachedFile
      ? `📄 [Attached: ${attachedFile.name}]\n\n${question}`
      : question;

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: userMessageContent,
      subject,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    const docContext = attachedFile?.content;
    setAttachedFile(null);
    setIsThinking(true);

    try {
      let sid = sessionId;
      if (!sid) {
        sid = await createSession();
        setSessionId(sid);
      }

      // Initialize assistant placeholder message for live streaming
      const assistantMsgId = generateUUID();
      const initialAssistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, initialAssistantMessage]);

      const finalAnswer = await askAlphaAskStream(
        question,
        sid,
        docContext,
        (textSoFar) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: textSoFar } : msg
            )
          );
        }
      );

      if (isAuthenticated) {
        setConversations((prev) => {
          const title = question.slice(0, 48) + (question.length > 48 ? "…" : "");
          if (activeId) {
            return prev.map((c) =>
              c.id === activeId ? { ...c, title, updatedAt: Date.now() } : c
            );
          }
          const newConvo: Conversation = {
            id: sid!,
            title,
            updatedAt: Date.now(),
            messages: [],
          };
          setActiveId(sid!);
          return [newConvo, ...prev];
        });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: generateUUID(),
          role: "assistant",
          content: `AlphaAsk couldn't reach the model just now (${detail}). Try sending that again.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [draft, isThinking, subject, attachedFile, sessionId, isAuthenticated, activeId, setConversations]);

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
    setSessionId(null);
    setAttachedFile(null);
  }, []);

  return {
    activeId,
    messages,
    draft,
    setDraft,
    subject,
    setSubject,
    attachedFile,
    handleAttachFile,
    handleRemoveFile,
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
