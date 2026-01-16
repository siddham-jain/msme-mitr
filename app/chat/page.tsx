"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { ChatInterfaceStream } from "@/components/mobile/ChatInterfaceStream";
import { ChatSidebar } from "@/components/mobile/ChatSidebar";
import { ChatErrorBoundary } from "@/components/mobile/ChatErrorBoundary";
import { Button } from "@/components/ui/button";
import { Menu, Globe, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { code: "en", label: "English", labelLocal: "English" },
  { code: "hi", label: "Hindi", labelLocal: "हिंदी" },
];

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default on desktop
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const prevChatIdRef = useRef<string | null>(null);

  // Trigger sidebar refresh when chat ID actually changes
  useEffect(() => {
    if (currentChatId !== prevChatIdRef.current) {
      prevChatIdRef.current = currentChatId;
      setRefreshTrigger(prev => prev + 1);
    }
  }, [currentChatId]);

  // Handle conversation change from ChatInterfaceStream
  const handleConversationChange = useCallback((conversationId: string | null) => {
    console.log('[ChatPage] Conversation changed to:', conversationId);

    // Requirement 4.1: Update sidebar highlight when conversation becomes active
    // Batch state updates to prevent multiple re-renders
    setCurrentChatId(prev => {
      if (prev === conversationId) return prev; // No change needed

      // Close sidebar on mobile when conversation changes
      if (window.innerWidth < 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }

      return conversationId;
    });
  }, []);

  // Handle new chat (triggered by user clicking button)
  const handleNewChat = useCallback(() => {
    console.log('[ChatPage] New chat triggered');
    // Trigger new conversation creation in ChatInterfaceStream
    setNewChatTrigger(prev => prev + 1);
    // Sidebar will close automatically when conversation changes via handleConversationChange
  }, []);

  // Handle chat selection from sidebar
  const handleSelectChat = useCallback((chatId: string) => {
    console.log('[ChatPage] Chat selected:', chatId);
    // Only update if different to prevent unnecessary re-renders
    setCurrentChatId(prev => prev === chatId ? prev : chatId);
    // Sidebar will close automatically when conversation changes via handleConversationChange
  }, []);

  return (
    <MobileLayout className="p-0 overflow-hidden flex flex-col" onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}>
      {/* Desktop Header - Matches Schemes Page */}
      <div className="hidden lg:block flex-shrink-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="icon-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/5">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
              <span className="font-semibold text-lg tracking-tight text-foreground">MSME Mitr</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
              <SelectTrigger className="w-24 h-10 text-sm">
                <Globe className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.labelLocal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Help Button */}
            <Button
              variant="ghost"
              size="icon"
              className="icon-btn"
              aria-label="Help"
            >
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        </header>
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* Chat Sidebar - Collapsible on both mobile and desktop */}
        <aside
          className={`
            h-full flex-shrink-0
            w-[280px] lg:w-[320px]
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "ml-0" : "-ml-[280px] lg:-ml-[320px]"}
          `}
        >
          <ChatSidebar
            language={currentLanguage}
            currentChatId={currentChatId || undefined}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            refreshTrigger={refreshTrigger}
            showLogo={false}
          />
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area - Wrapped in Error Boundary */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-[var(--background)]">
          {/* Desktop Header moved to top level */}

          <div className="flex-1 min-h-0 relative">
            <ChatErrorBoundary
              language={currentLanguage}
              onError={(error, errorInfo) => {
                console.error('Chat error caught by boundary:', error, errorInfo);
              }}
            >
              <ChatInterfaceStream
                language={currentLanguage}
                onConversationChange={handleConversationChange}
                newChatTrigger={newChatTrigger}
                selectedChatId={currentChatId}
              />
            </ChatErrorBoundary>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
