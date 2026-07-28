import { useEffect, useMemo, useState } from "react";
import { fetchConversations } from "../lib/api-mock";
import type { Conversation } from "../types";

export function useConversations(isAuthenticated: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    fetchConversations().then((data) => {
      if (!cancelled) setConversations(data);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      ),
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
