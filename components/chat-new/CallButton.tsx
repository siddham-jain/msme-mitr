'use client'

import { Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function CallButton() {
  const [isCallActive, setIsCallActive] = useState(false)

  const handleCall = () => {
    // Placeholder for voice call functionality
    // This will be implemented later with actual AI voice agent integration

    if (isCallActive) {
      // End call
      setIsCallActive(false)
      toast.info('Call ended')
      console.log('Voice call ended')
    } else {
      // Start call
      setIsCallActive(true)
      toast.success('Connecting to AI assistant...')
      console.log('Voice call initiated - Feature coming soon!')

      // TODO: Implement actual voice call functionality
      // - Connect to AI voice agent (OpenAI Realtime API or similar)
      // - Handle audio input/output
      // - Display call duration
      // - Show call controls (mute, speaker, end call)
    }
  }

  return (
    <button
      onClick={handleCall}
      className={`flex items-center gap-2 h-9 px-3 rounded-md border transition-all text-sm font-medium ${
        isCallActive
          ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
          : 'border-[#E5E7EB] text-[#40414F] hover:bg-[#F7F7F8]'
      }`}
      aria-label={isCallActive ? 'End call' : 'Start voice call'}
    >
      <Phone
        className={`w-4 h-4 ${isCallActive ? 'animate-pulse' : ''}`}
      />
      <span className="hidden sm:inline">
        {isCallActive ? 'End Call' : 'Call'}
      </span>
    </button>
  )
}
