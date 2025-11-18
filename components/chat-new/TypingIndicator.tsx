'use client'

export function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-[#8E8EA0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
