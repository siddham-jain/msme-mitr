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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

interface ChatSidebarProps {
  language?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
  onBrowseSchemes?: () => void; // Optional callback when Browse Schemes is clicked
}

export function ChatSidebar({
  language = "en",
  onNewChat,
  onSelectChat,
  currentChatId,
  refreshTrigger,
  onBrowseSchemes,
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
    <aside className="flex flex-col h-full bg-background border-r">
      {/* Sidebar Header */}
      <div className="p-3 space-y-2">
        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 btn-touch transition-all duration-200 hover:scale-[1.02]"
          size="default"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{isHindi ? "नया चैट" : "New Chat"}</span>
        </Button>

        {/* Schemes Button */}
        <Link href="/schemes" className="block" onClick={onBrowseSchemes}>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 btn-touch transition-all duration-200 hover:scale-[1.02]"
            size="default"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">{isHindi ? "योजनाएं खोजें" : "Browse Schemes"}</span>
          </Button>
        </Link>
      </div>

      <div className="border-t" />

      {/* Chat History Section */}
      <div className="px-4 py-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          {isHindi ? "चैट इतिहास" : "Chat History"}
        </h3>
      </div>

      {/* Chat History List - with explicit height for scrolling */}
      <div className="flex-1 overflow-hidden px-2">
        <ScrollArea className="h-full">
          <div className="space-y-1 pb-4 pr-2">
            {loading ? (
            // Loading skeleton (Requirement 9.10)
            <div className="space-y-2 px-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-lg p-2.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive animate-fade-in">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">
                {isHindi ? "लोड करने में विफल" : "Failed to load"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {isHindi ? "कृपया पुनः प्रयास करें" : "Please try again"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                className="transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isHindi ? "पुनः प्रयास करें" : "Retry"}
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground animate-fade-in">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">
                {isHindi ? "कोई चैट नहीं" : "No conversations yet"}
              </p>
              <p className="text-xs leading-relaxed">
                {isHindi ? "नया चैट शुरू करें" : "Start a new chat to begin"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  group relative rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    currentChatId === conv.id
                      ? "border-l-2 border-primary bg-muted/30"
                      : "hover:bg-muted/30"
                  }
                `}
                onClick={() => onSelectChat?.(conv.id)}
              >
                <div className="flex items-start gap-2.5 p-2">
                  {conv.is_pinned ? (
                    <Pin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary fill-current" />
                  ) : (
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${
                        currentChatId === conv.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate leading-snug">
                      {conv.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(conv.last_active_at)}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {conv.message_count} {conv.message_count === 1 ? 'msg' : 'msgs'}
                      </p>
                    </div>
                  </div>

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(conv.id, !!conv.is_pinned);
                        }}
                        className="cursor-pointer"
                      >
                        <Pin className="w-4 h-4 mr-2" />
                        {conv.is_pinned
                          ? (isHindi ? "अनपिन करें" : "Unpin")
                          : (isHindi ? "पिन करें" : "Pin")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conv.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isHindi ? "हटाएं" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t space-y-2.5">
        {/* User Profile Menu */}
        {profile && (
          <UserProfileMenu language={language as 'en' | 'hi'} align="start" fullWidth={true} />
        )}

        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-1 py-0.5">
          <span className="text-xs text-muted-foreground font-medium">
            {isHindi ? "थीम" : "Theme"}
          </span>
          <ThemeToggle size="sm" />
        </div>

        {/* Chat Count */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          {isHindi
            ? `${conversations.length} चैट`
            : `${conversations.length} ${conversations.length === 1 ? 'chat' : 'chats'}`}
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isHindi ? "चैट हटाएं?" : "Delete chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isHindi
                ? "यह चैट और सभी संदेश स्थायी रूप से हटा दिए जाएंगे। इसे पूर्ववत नहीं किया जा सकता।"
                : "This chat and all its messages will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isHindi ? "रद्द करें" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isHindi ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
