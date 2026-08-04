import { useCallback, useRef, useState } from "react";
import { askAlphaAskStream, createSession, fetchHistory } from "../lib/api";
import { generateUUID } from "../lib/utils";
import type { Conversation, Message, SubjectKey, AttachedFile } from "../types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [ragMode, setRagMode] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setSessionId(null);
    setMessages([]);
    setDraft("");
    setSubject(undefined);
    setAttachedFile(null);
    setRagMode(false);
    textareaRef.current?.focus();
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setSessionId(id);
    setMessages([]);
    setIsThinking(true);
    try {
      const historyMsgs = await fetchHistory(id);
      setMessages(historyMsgs);
    } catch {
      // keep empty if network fail
    } finally {
      setIsThinking(false);
    }
  }, []);

  const handleStarterClick = useCallback((prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  }, []);

  const handleAttachFile = useCallback((file: File) => {
    const maxBytes = 15 * 1024 * 1024; // 15MB max
    if (file.size > maxBytes) {
      alert("File size exceeds 15MB limit. Please attach a smaller document.");
      return;
    }

    const sizeStr = formatFileSize(file.size);
    const fileName = file.name;

    // Set initial parsing state immediately
    setAttachedFile({
      name: fileName,
      content: "",
      sizeFormatted: sizeStr,
      fileType: fileName.toLowerCase().endsWith(".pdf") || file.type === "application/pdf" ? "pdf" : "text",
      status: "parsing",
      wordCount: 0,
    });

    const isPdf = fileName.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || "";
        // Estimate PDF word count based on file size and text content
        const rawBytes = dataUrl.length;
        const estimatedWords = Math.max(50, Math.round(rawBytes / 12));
        setAttachedFile({
          name: fileName,
          content: dataUrl,
          sizeFormatted: sizeStr,
          fileType: "pdf",
          status: "ready",
          wordCount: estimatedWords,
        });
      };
      reader.onerror = () => {
        setAttachedFile({
          name: fileName,
          content: "",
          sizeFormatted: sizeStr,
          fileType: "pdf",
          status: "error",
          wordCount: 0,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || "";
        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        setAttachedFile({
          name: fileName,
          content: text,
          sizeFormatted: sizeStr,
          fileType: "text",
          status: "ready",
          wordCount: words,
          extractedText: text,
        });
      };
      reader.onerror = () => {
        setAttachedFile({
          name: fileName,
          content: "",
          sizeFormatted: sizeStr,
          fileType: "text",
          status: "error",
          wordCount: 0,
        });
      };
      reader.readAsText(file);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
  }, []);

  const toggleRagMode = useCallback(() => {
    setRagMode((prev) => !prev);
  }, []);

  const handleSend = useCallback(async () => {
    const question = draft.trim();
    if (!question || isThinking) return;

    const ragTag = ragMode ? " [⚡ RAG Strict Grounding Mode]" : "";
    const userMessageContent = attachedFile
      ? `📄 [Attached: ${attachedFile.name}${attachedFile.sizeFormatted ? ` (${attachedFile.sizeFormatted})` : ""}${ragTag}]\n\n${question}`
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
    const isRag = ragMode;
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

      await askAlphaAskStream(
        question,
        sid,
        docContext,
        subject,
        isRag,
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
    ragMode,
    toggleRagMode,
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
