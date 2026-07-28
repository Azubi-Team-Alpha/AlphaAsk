import React, { useEffect, useRef, useState } from "react";
import type { ThemeMode } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useConversations } from "../hooks/useConversations";
import { useChat } from "../hooks/useChat";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Hero } from "./Hero";
import { MessageThread } from "./MessageThread";
import { AuthModal } from "./AuthModal";
import { QuestionManagement } from "./QuestionManagement";
import { FAQ } from "./FAQ";
import "../styles/alphaask.css";

export default function AlphaAskApp() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showQuestionManagement, setShowQuestionManagement] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  // `auth`'s onLogOut callback closes over `chat`, which is declared further
  // below — safe because the callback only runs on a later user action
  // (after the whole component has finished rendering once).
  const auth = useAuth({
    onLogOut: () => {
      chat.resetThread();
    },
  });

  const { filteredConversations, setConversations, search, setSearch, searchOpen, setSearchOpen } =
    useConversations(auth.isAuthenticated);

  const chat = useChat({
    isAuthenticated: auth.isAuthenticated,
    setConversations,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.isThinking]);

  const showHero = chat.messages.length === 0;

  return (
    <div className={`aa-root aa-theme-${theme}`}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        search={search}
        setSearch={setSearch}
        startNewChat={chat.startNewChat}
        isAuthenticated={auth.isAuthenticated}
        currentUser={auth.currentUser}
        filteredConversations={filteredConversations}
        activeId={chat.activeId}
        openConversation={chat.openConversation}
        handleLogOut={auth.handleLogOut}
        onSignUpClick={() => auth.setAuthModalMode("signup")}
        onQuestionManagementClick={() => setShowQuestionManagement(true)}
        onFAQClick={() => setShowFAQ(true)}
      />

      <div className="aa-main">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          toggleTheme={toggleTheme}
          isAuthenticated={auth.isAuthenticated}
          onLoginClick={() => auth.setAuthModalMode("login")}
          onSignUpClick={() => auth.setAuthModalMode("signup")}
        />

        <div className="aa-thread" ref={scrollRef}>
          {showHero ? (
            <Hero
              isAuthenticated={auth.isAuthenticated}
              currentUser={auth.currentUser}
              draft={chat.draft}
              setDraft={chat.setDraft}
              onSend={chat.handleSend}
              onKeyDown={chat.handleKeyDown}
              isThinking={chat.isThinking}
              textareaRef={chat.textareaRef}
              subject={chat.subject}
              setSubject={chat.setSubject}
              onStarterClick={chat.handleStarterClick}
              onSignUpClick={() => auth.setAuthModalMode("signup")}
            />
          ) : (
            <MessageThread
              messages={chat.messages}
              isThinking={chat.isThinking}
              draft={chat.draft}
              setDraft={chat.setDraft}
              onSend={chat.handleSend}
              onKeyDown={chat.handleKeyDown}
              subject={chat.subject}
              setSubject={chat.setSubject}
              isAuthenticated={auth.isAuthenticated}
            />
          )}
        </div>
      </div>

      {auth.authModalMode && (
        <AuthModal
          mode={auth.authModalMode}
          onClose={() => auth.setAuthModalMode(null)}
          onSwitchMode={auth.setAuthModalMode}
          onSubmit={auth.handleAuthSubmit}
        />
      )}

      {showQuestionManagement && (
        <QuestionManagement onClose={() => setShowQuestionManagement(false)} />
      )}

      {showFAQ && (
        <FAQ onClose={() => setShowFAQ(false)} />
      )}
    </div>
  );
}
