'use client'

import { Share2 } from 'lucide-react'

export function ShareButton() {
  const handleShare = () => {
    // Simple share functionality - copy current URL to clipboard
    if (navigator.clipboard && window.location) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          // Could add a toast notification here
          console.log('Link copied to clipboard')
        })
        .catch((err) => {
          console.error('Failed to copy link:', err)
        })
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 h-9 px-3 rounded-md border border-[#E5E7EB] text-[#40414F] hover:bg-[#F7F7F8] transition-colors text-sm font-medium"
      aria-label="Share chat"
    >
      <Share2 className="w-4 h-4" />
      <span className="hidden sm:inline">Share</span>
    </button>
  )
}
