"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Memoize the component to prevent unnecessary re-renders
export const MessageBubble = React.memo(function MessageBubble({ role, content, isStreaming = false }: MessageBubbleProps) {
  const isUser = role === "user";

  // Define custom components with proper typing for react-markdown v10
  // Use consistent text-sm sizing throughout to match the base text size
  const markdownComponents: Components = {
    // Customize markdown rendering with consistent sizing
    p: ({ node, ...props }) => <p className="text-sm mb-2 last:mb-0 leading-relaxed" {...props} />,
    ul: ({ node, ...props }) => <ul className="text-sm mb-2 ml-4 list-disc space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="text-sm mb-2 ml-4 list-decimal space-y-1" {...props} />,
    li: ({ node, ...props }) => <li className="text-sm leading-relaxed" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    code: (props) => {
      const { inline, className, children, ...rest } = props as any;
      if (inline) {
        return (
          <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono" {...rest}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-muted-foreground/10 p-3 rounded-lg overflow-x-auto mb-2">
          <code className={`text-xs font-mono block ${className || ''}`}>{children}</code>
        </pre>
      );
    },
    a: ({ node, children, href, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:no-underline text-sm"
        {...props}
      >
        {children}
      </a>
    ),
    h1: ({ node, ...props }) => <h1 className="text-base font-bold mb-2 mt-0" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-sm font-bold mb-2 mt-0" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mb-2 mt-0" {...props} />,
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar with Sparkles icon */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--muted-foreground)]" />
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-[var(--muted)] text-[var(--foreground)]"
            : "bg-[var(--card)] backdrop-blur-[8px] border border-[var(--border)] text-[var(--foreground)]",
          isStreaming && "animate-pulse-subtle"
        )}
      >
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* User avatar - removed for cleaner look */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--muted-foreground)]" />
          </div>
        </div>
      )}
    </div>
  );
});
