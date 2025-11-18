'use client'

import { Send, Mic, Square } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  disabled?: boolean
  placeholder?: string
  isGenerating?: boolean
  onStopGenerating?: () => void
  onVoiceInput?: () => void
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  placeholder = 'Ask anything',
  isGenerating = false,
  onStopGenerating,
  onVoiceInput
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [value])

  return (
    <div className="relative flex items-end gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)] focus-within:shadow-[0_0_10px_rgba(0,0,0,0.15)] transition-shadow">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-h-[24px] max-h-[200px] resize-none border-0 outline-none p-0 text-[14px] sm:text-[15px] text-[#40414F] placeholder:text-[#8E8EA0] bg-transparent"
        rows={1}
        style={{ fieldSizing: 'content' } as any}
      />

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Voice Input Button */}
        {onVoiceInput && !isGenerating && (
          <button
            onClick={onVoiceInput}
            disabled={disabled}
            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[#F7F7F8] disabled:opacity-50 text-[#8E8EA0] hover:text-[#40414F] transition-colors flex items-center justify-center"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        {/* Stop Generating or Send Button */}
        {isGenerating && onStopGenerating ? (
          <button
            onClick={onStopGenerating}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#10A37F] hover:bg-[#0D8A6B] text-white transition-colors flex items-center justify-center"
            aria-label="Stop generating"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#10A37F] hover:bg-[#0D8A6B] disabled:bg-[#E5E7EB] disabled:text-[#8E8EA0] text-white transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
