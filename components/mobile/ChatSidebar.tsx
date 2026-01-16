"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  Trash2,
  MoreVertical,
  Pin,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfileMenu } from "@/components/shared/UserProfileMenu";
import { toast } from "sonner";

interface ChatSidebarProps {
  language?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
  onBrowseSchemes?: () => void; // Optional callback when Browse Schemes is clicked
  showLogo?: boolean;
}

export function ChatSidebar({
  language = "en",
  onNewChat,
  onSelectChat,
  currentChatId,
  refreshTrigger,
  onBrowseSchemes,
  showLogo = true,
}: ChatSidebarProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const isHindi = language === "hi";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Use database hook instead of localStorage
  const {
    conversations,
    loading,
    error,
    deleteConversation: deleteConversationDb,
    pinConversation,
    unpinConversation,
    refresh,
  } = useConversations();

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('[ChatSidebar] Refresh triggered:', refreshTrigger);
      refresh();
    }
  }, [refreshTrigger, refresh]);

  // Log current chat ID changes for debugging
  useEffect(() => {
    console.log('[ChatSidebar] Current chat ID changed to:', currentChatId);
    console.log('[ChatSidebar] Conversations:', conversations.map(c => ({ id: c.id, title: c.title, count: c.message_count })));
  }, [currentChatId, conversations]);

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return isHindi ? "अभी" : "Now";
    } else if (minutes < 60) {
      return isHindi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
    } else if (hours < 24) {
      return isHindi ? `${hours} घंटे पहले` : `${hours}h ago`;
    } else if (days === 1) {
      return isHindi ? "कल" : "Yesterday";
    } else {
      return isHindi ? `${days} दिन पहले` : `${days}d ago`;
    }
  };

  const handleDeleteClick = (chatId: string) => {
    setConversationToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const isCurrentChat = conversationToDelete === currentChatId;

    const success = await deleteConversationDb(conversationToDelete);
    if (success) {
      // Requirement 4.4: Remove conversation from sidebar when deleted
      console.log('[ChatSidebar] Conversation deleted:', conversationToDelete);

      // Requirement 4.5, 4.6: If deleting current chat, auto-create or switch to another conversation
      if (isCurrentChat) {
        console.log('[ChatSidebar] Deleted conversation was active, triggering new chat');
        // The useConversationStoreDb hook will handle creating a new conversation
        // or switching to an existing one
        onNewChat?.();
      }
    }

    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleTogglePin = async (chatId: string, currentPinned: boolean) => {
    if (currentPinned) {
      await unpinConversation(chatId);
    } else {
      await pinConversation(chatId);
    }
  };



  return (
    <aside
      className="flex flex-col h-full bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]"
      aria-label="Conversation history"
    >
      {/* Sidebar Header - Zen Styled */}
      <div className="p-5 pb-2">
        {showLogo && (
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/5">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">MSME Mitr</span>
          </div>
        )}

        <div className="space-y-2">
          {/* New Chat Button - Styled as Zen Nav Item */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 text:[var(--foreground)] hover:bg-white/10 hover:text-white transition-all group border border-transparent hover:border-white/5"
          >
            <Plus className="w-5 h-5 text-[var(--text-muted)] group-hover:text-white transition-colors" />
            <span className="text-sm font-medium">{isHindi ? "नया चैट" : "New Chat"}</span>
          </button>

          {/* Schemes Button */}
          <Link href="/schemes" className="block" onClick={onBrowseSchemes}>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[var(--text-muted)] hover:bg-white/5 hover:text-white transition-all group"
            >
              <Search className="w-5 h-5 transition-colors" />
              <span className="text-sm font-medium">{isHindi ? "योजनाएं खोजें" : "Browse Schemes"}</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="px-5 py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent opacity-50" />
      </div>

      {/* Chat History Section */}
      <div className="px-6 py-2">
        <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 opacity-60">
          <Clock className="w-3 h-3" />
          {isHindi ? "इतिहास" : "History"}
        </h3>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-hidden px-4">
        <ScrollArea className="h-full custom-scrollbar pr-2">
          <div className="space-y-1 pb-4">
            {loading ? (
              <div className="space-y-2 px-1 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                <span className="text-xs">{isHindi ? "त्रुटि" : "Error loading chats"}</span>
                <Button variant="link" size="sm" onClick={() => refresh()} className="text-xs h-auto p-0 ml-2">{isHindi ? "पुनः प्रयास करें" : "Retry"}</Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-[var(--text-muted)] opacity-50">
                <span className="text-xs">{isHindi ? "कोई इतिहास नहीं" : "No history"}</span>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                  group relative rounded-xl transition-all duration-200 cursor-pointer px-3 py-2.5
                  ${currentChatId === conv.id
                      ? "bg-white/5 text-white shadow-sm ring-1 ring-white/5"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                    }
                `}
                  onClick={() => onSelectChat?.(conv.id)}
                >
                  <div className="flex items-center gap-3">
                    {conv.is_pinned ? (
                      <Pin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    ) : (
                      <MessageSquare
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${currentChatId === conv.id ? "text-primary" : "opacity-50"
                          }`}
                      />
                    )}
                    <span className="text-sm font-medium truncate flex-1">
                      {conv.title}
                    </span>

                    {/* More Options */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded-md hover:bg-white/10 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[var(--surface-elevated)] border-[var(--border)]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(conv.id, !!conv.is_pinned);
                            }}
                          >
                            <Pin className="w-4 h-4 mr-2" />
                            {conv.is_pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(conv.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 mt-auto">
        <div className="rounded-2xl bg-white/5 p-1 border border-white/5">
          <UserProfileMenu language={language as 'en' | 'hi'} align="start" fullWidth={true} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[var(--surface-elevated)] border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{isHindi ? "चैट हटाएं?" : "Delete chat?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              {isHindi
                ? "यह चैट और सभी संदेश स्थायी रूप से हटा दिए जाएंगे।"
                : "This chat and all its messages will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[var(--border)] text-white hover:bg-white/5">{isHindi ? "रद्द करें" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isHindi ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
