import { useEffect, useMemo, useState } from "react";
import { fetchConversations } from "../lib/api";
import type { Conversation } from "../types";

export function useConversations(isAuthenticated: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    fetchConversations().then((data) => {
      if (!cancelled) {
        const sorted = [...data].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setConversations(sorted);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const filteredConversations = useMemo(
    () =>
      conversations
        .filter((c) =>
          c.title.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [conversations, search]
  );

  return {
    conversations,
    setConversations,
    filteredConversations,
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
  };
}
