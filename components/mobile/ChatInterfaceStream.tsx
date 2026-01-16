"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineModeMessage } from "@/components/ui/network-status";
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SchemeCard } from "@/components/chat/SchemeCard";
import { useConversationStoreDb } from "@/hooks/useConversationStoreDb";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import { useConversationTransition } from "@/hooks/useConversationTransition";
import { announceToScreenReader, getUserFriendlyErrorMessage, withRetry } from "@/lib/utils";
import {
  Send,
  Mic,
  Sparkles,
  Paperclip,
  Loader2,
  Square,
  HelpCircle,
  IndianRupee,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  WifiOff,
  Image as ImageIcon,
  PenTool,
  ChevronDown,
  LayoutGrid,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";

interface QuickPrompt {
  text: string;
  textHi?: string;
  icon: React.ReactNode;
  category: string;
}

const quickPrompts: QuickPrompt[] = [
  {
    text: "What schemes am I eligible for?",
    textHi: "मैं किन योजनाओं के लिए पात्र हूं?",
    icon: <HelpCircle className="w-4 h-4" />,
    category: "eligibility",
  },
  {
    text: "I need a business loan",
    textHi: "मुझे व्यावसायिक ऋण चाहिए",
    icon: <IndianRupee className="w-4 h-4" />,
    category: "loan",
  },
  {
    text: "How to apply for PMEGP scheme?",
    textHi: "PMEGP योजना के लिए आवेदन कैसे करें?",
    icon: <FileText className="w-4 h-4" />,
    category: "application",
  },
];

export interface ChatInterfaceStreamProps {
  language?: string;
  userProfile?: any;
  onConversationChange?: (conversationId: string | null) => void;
  newChatTrigger?: number;
  selectedChatId?: string | null;
}

export function ChatInterfaceStream({
  language = "en",
  userProfile = {},
  onConversationChange,
  newChatTrigger = 0,
  selectedChatId,
}: ChatInterfaceStreamProps) {
  const { isOfflineMode } = useOfflineMode();
  const isHindi = language === "hi";

  // Use database-backed conversation store
  const {
    conversation,
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    stop,
    createNewConversation,
    switchConversation,
  } = useConversationStoreDb({
    language,
    userProfile,
    onConversationChange,
  });

  // Helper to extract text from AI SDK v5 message parts - memoized to prevent re-creation
  const getMessageText = React.useCallback((message: any): string => {
    // Direct string content (most common)
    if (typeof message.content === 'string' && message.content) {
      return message.content;
    }

    // Text field (fallback)
    if (typeof message.text === 'string' && message.text) {
      return message.text;
    }

    // Parts array (AI SDK v5 format)
    if (message.parts && Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part: any) => part && (part.type === 'text' || part.text))
        .map((part: any) => part.text || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    // Content array format
    if (message.content && Array.isArray(message.content)) {
      const text = message.content
        .filter((c: any) => c && (c.type === 'text' || c.type === 'output_text' || c.type === 'input_text'))
        .map((c: any) => c.text || c.content || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    console.warn('Unable to extract text from message:', message);
    return '';
  }, []);

  // Track if we're in the middle of creating a new conversation
  const isCreatingNewRef = useRef(false);
  const lastProcessedTriggerRef = useRef(0);

  // Track failed messages and preserve user input
  const [failedMessageId, setFailedMessageId] = React.useState<string | null>(null);
  const [preservedInput, setPreservedInput] = React.useState<string>('');
  const [sendError, setSendError] = React.useState<Error | null>(null);

  // Conversation transition hook for smooth switching
  const {
    transitionState,
    targetConversationId,
    error: transitionError,
    switchConversation: transitionSwitchConversation,
    retry: retryTransition,
  } = useConversationTransition({
    minLoadingTime: 100,
    transitionDelay: 200,
    onTransitionStart: () => {
      announceToScreenReader(
        isHindi ? 'बातचीत लोड हो रही है' : 'Loading conversation',
        'polite'
      );
    },
    onTransitionComplete: () => {
      announceToScreenReader(
        isHindi ? 'बातचीत लोड हो गई' : 'Conversation loaded',
        'polite'
      );
    },
  });

  // Voice recording hook
  const voice = useChatVoiceInput((transcript) => {
    setInput(transcript);
    setTimeout(() => {
      // Logic for submitting center or bottom form
      if (messages.length === 0) {
        // Center form submit - manual trigger since it might not be a real form submit event
        handleSubmit();
      } else {
        const form = document.querySelector('form.bottom-chat-form') as HTMLFormElement;
        if (form && transcript.trim()) {
          form.requestSubmit();
        }
      }
    }, 100);
  });

  // Smart auto-scroll with user scroll detection
  const { scrollAreaRef, messagesEndRef } = useSmartScroll(messages);

  // Handle new chat trigger from parent component
  useEffect(() => {
    // Only process if trigger value changed and we're not already creating
    if (
      newChatTrigger > 0 &&
      newChatTrigger !== lastProcessedTriggerRef.current &&
      !isCreatingNewRef.current
    ) {
      console.log('[ChatInterfaceStream] New chat trigger detected:', newChatTrigger);
      lastProcessedTriggerRef.current = newChatTrigger;
      isCreatingNewRef.current = true;

      createNewConversation().then((conversationId) => {
        console.log('[ChatInterfaceStream] New conversation created:', conversationId);
        // The onConversationChange callback will be called by createNewConversation
        // which will update the parent's currentChatId and close the sidebar
      }).finally(() => {
        isCreatingNewRef.current = false;
      });
    }
  }, [newChatTrigger, createNewConversation]);

  // Track the last selected chat ID to prevent duplicate switches
  const lastSelectedChatIdRef = useRef<string | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);

  // Update ref when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      currentConversationIdRef.current = conversation.id;
      lastSelectedChatIdRef.current = conversation.id;
    }
  }, [conversation?.id]);

  // Handle conversation selection from sidebar with smooth transition
  useEffect(() => {
    if (
      selectedChatId &&
      selectedChatId !== conversation?.id &&
      selectedChatId !== currentConversationIdRef.current &&
      selectedChatId !== lastSelectedChatIdRef.current &&
      !isCreatingNewRef.current &&
      transitionState === 'idle'
    ) {
      console.log('[ChatInterfaceStream] Switching to conversation:', selectedChatId);
      lastSelectedChatIdRef.current = selectedChatId;

      transitionSwitchConversation(selectedChatId, async () => {
        await switchConversation(selectedChatId);

        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
          }
        }, 50);
      });
    }
  }, [selectedChatId, conversation?.id, switchConversation, transitionState, transitionSwitchConversation, messagesEndRef, messages.length]);

  // Ref for textarea to manage focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content - debounced to prevent jitter
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use requestAnimationFrame to batch DOM updates
    const resizeHandle = requestAnimationFrame(() => {
      // Reset height to initial 44px to get the correct scrollHeight
      textarea.style.height = messages.length === 0 ? '112px' : '44px'; // Larger initial height for hero input

      // Calculate new height with max of 120px
      const newHeight = Math.min(textarea.scrollHeight, 160);
      textarea.style.height = `${newHeight}px`;
    });

    return () => cancelAnimationFrame(resizeHandle);
  }, [input, messages.length]);

  // Handle submit with offline mode support and error handling
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    // Clear any previous errors
    setSendError(null);
    setFailedMessageId(null);

    // Preserve input in case of error
    const messageToSend = input.trim();
    setPreservedInput(messageToSend);

    // If offline, show warning but still try to send
    if (isOfflineMode) {
      toast.info(
        isHindi
          ? 'आप ऑफ़लाइन प्रतीत होते हैं। संदेश नहीं भेजा जा सकता।'
          : 'You appear to be offline. Message may not send.'
      );
    }

    // Announce to screen readers
    announceToScreenReader(
      isHindi ? 'संदेश भेजा जा रहा है' : 'Sending message',
      'polite'
    );

    try {
      // Send via conversation store with retry logic
      await withRetry(
        async () => {
          await sendMessage(messageToSend);
        },
        3, // max retries
        1000 // initial delay
      );

      // Success - clear preserved input
      setPreservedInput('');

      // Announce success
      announceToScreenReader(
        isHindi ? 'संदेश भेजा गया' : 'Message sent',
        'polite'
      );
    } catch (err) {
      // Error - preserve input and show error
      console.error('Failed to send message:', err);
      setSendError(err instanceof Error ? err : new Error('Failed to send message'));
      setInput(messageToSend); // Restore input

      // Announce error
      announceToScreenReader(
        isHindi ? 'संदेश भेजने में विफल' : 'Failed to send message',
        'assertive'
      );

      // Show toast with user-friendly message
      toast.error(getUserFriendlyErrorMessage(err, language));
    }

    // Keep focus on textarea for next message
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [input, isOfflineMode, sendMessage, isHindi, isLoading, language]);

  // Handle Enter key for sending messages
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift: Submit message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit();
      }
    }
    // Shift+Enter: New line (default textarea behavior)
  }, [input, handleSubmit]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    // Trigger form submission programmatically
    setTimeout(() => {
      handleSubmit();
    }, 0);
  }, [setInput, handleSubmit]);

  // Handle retry for failed messages
  const handleRetry = useCallback(() => {
    if (preservedInput) {
      setInput(preservedInput);
      setSendError(null);
      setFailedMessageId(null);

      // Trigger form submission
      setTimeout(() => {
        handleSubmit();
      }, 0);
    }
  }, [preservedInput, setInput, handleSubmit]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)] relative">
      {/* Loading Overlay */}
      {(transitionState === 'loading' || transitionState === 'transitioning') && (
        <div
          className="absolute inset-0 bg-[#0A0A0F]/90 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" aria-hidden="true" />
            <p className="text-sm text-[#71717A] font-medium">
              {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col items-center">
        <ScrollArea className="w-full h-full" ref={scrollAreaRef}>
          <div className="w-full min-h-full flex flex-col">

            {/* HERO SECTION / EMPTY STATE */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-4xl mx-auto w-full">
                {/* Hero Title */}
                <div className="stagger-reveal text-center mb-10">
                  <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-white">
                    {isHindi ? "MSME मित्र में आपका स्वागत है" : "Welcome to MSME Mitr"}
                  </h1>
                  <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto">
                    {isHindi
                      ? "सरकारी योजनाओं और व्यवसाय ऋण के लिए आपका AI सहायक"
                      : "Your AI Assistant for Government Schemes & Business Loans"}
                  </p>
                </div>

                {/* Status Pill (Mock for Zen aesthetic) */}


                {/* CENTER INPUT - ZEN STYLE */}
                <div className="stagger-reveal w-full max-w-2xl mx-auto mb-16 relative z-10">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[32px] overflow-hidden soft-shadow input-focus transition-all duration-500 group focus-within:ring-1 focus-within:ring-primary/30">
                    <div className="p-6 pb-2 text-left">
                      <Textarea
                        ref={messages.length === 0 ? textareaRef : null}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isHindi ? "आप क्या बनाना चाहते हैं..." : "Describe what you want to achieve..."}
                        className="w-full bg-transparent border-none focus:ring-0 text-xl resize-none h-20 placeholder:text-neutral-600 font-light focus-visible:ring-0 p-0 shadow-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-t border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon-sm" className="text-[var(--text-muted)] hover:text-white transition-colors">
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        {voice.isRecording && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-red-400 font-medium">{voice.duration}</span>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={voice.toggleVoiceMode}
                          className={`rounded-full w-10 h-10 transition-colors ${voice.isRecording ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'hover:bg-white/5 text-[var(--text-muted)]'}`}
                        >
                          {voice.isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : voice.isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                        </Button>

                        <Button
                          onClick={() => handleSubmit()}
                          disabled={!input.trim() || isLoading}
                          className={`rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 ${input.trim() ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'bg-white/5 text-neutral-500'}`}
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT PROJECTS GRID (Mock for aesthetics) */}
                <div className="stagger-reveal w-full max-w-5xl mx-auto px-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-medium text-white/90">{isHindi ? "सुझाव" : "Suggestions"}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickPrompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleQuickPrompt(isHindi && prompt.textHi ? prompt.textHi : prompt.text)}
                        className="group cursor-pointer rounded-[24px] bg-[var(--surface)] border border-[var(--border)] p-1 hover:border-white/10 hover:bg-[var(--surface-elevated)] transition-all duration-300"
                      >
                        <div className="bg-neutral-900/30 rounded-[20px] p-5 h-32 flex flex-col justify-between group-hover:bg-neutral-900/50 transition-colors relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              <div className="text-white/70">{prompt.icon}</div>
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors pr-8 leading-relaxed">
                            {isHindi && prompt.textHi ? prompt.textHi : prompt.text}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-600 font-medium uppercase tracking-wider">
                            <span>{prompt.category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VISIBLE MESSAGES */}
            {messages.length > 0 && (
              <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-4">
                <div className="space-y-6 pt-6">
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      role={message.role as "user" | "assistant"}
                      content={getMessageText(message)}
                      isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                    />
                  ))}
                  {(error || sendError) && (
                    <Card className="bg-destructive/10 border-destructive/30 p-4 shadow-sm animate-slide-in">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-destructive mb-1">
                            {isHindi ? 'संदेश भेजने में विफल' : 'Failed to send message'}
                          </p>
                          <p className="text-sm text-destructive/90">
                            {getUserFriendlyErrorMessage(sendError || error, language)}
                          </p>
                          {preservedInput && (
                            <Button onClick={handleRetry} size="sm" variant="outline" className="mt-2 border-destructive/40 text-destructive hover:bg-destructive/15">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {isHindi ? 'पुनः प्रयास करें' : 'Retry'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* FIXED BOTTOM INPUT - Visible only when messages exist */}
      {messages.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl p-4 safe-bottom bottom-chat-form transition-all duration-300"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 rounded-full w-10 h-10"
              onClick={() => toast.info('Image upload coming soon!')}
              disabled={isLoading}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative bg-[var(--surface)] border border-[var(--border)] rounded-[24px] focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isHindi ? "संदेश लिखें..." : "Message MSME Mitr..."}
                className="w-full bg-transparent border-none focus-visible:ring-0 min-h-[44px] max-h-[120px] text-sm resize-none overflow-y-auto py-3 px-4"
                rows={1}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`rounded-full w-10 h-10 ${voice.isRecording ? 'bg-red-500/10 text-red-500' : ''}`}
                onClick={voice.toggleVoiceMode}
                disabled={isLoading || voice.isTranscribing}
              >
                {voice.isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : voice.isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
              </Button>

              {isLoading ? (
                <Button type="button" onClick={() => stop()} variant="destructive" size="icon" className="rounded-full w-10 h-10">
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim()} size="icon" className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-white">
                  <Send className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}