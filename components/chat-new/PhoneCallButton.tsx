'use client'

import { Phone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useState } from 'react'

export function PhoneCallButton() {
  const [isOpen, setIsOpen] = useState(false)

  const supportNumbers = [
    { label: 'General Support', number: '+91-11-2338-1000' },
    { label: 'Scheme Queries', number: '+91-11-2338-2000' },
    { label: 'Technical Help', number: '+91-11-2338-3000' }
  ]

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 h-9 px-3 rounded-md border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors text-sm font-medium">
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Call Support</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#40414F] text-lg font-semibold">
            Contact MSME Support
          </DialogTitle>
          <DialogDescription className="text-[#8E8EA0] text-sm">
            Choose a support line to speak with our team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {supportNumbers.map((item) => (
            <button
              key={item.number}
              onClick={() => handleCall(item.number)}
              className="w-full flex items-start gap-3 p-4 bg-white border border-[#E5E7EB] hover:border-[#007AFF] hover:bg-[#007AFF]/5 rounded-lg text-left transition-all"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#007AFF]/10 flex-shrink-0">
                <Phone className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#40414F] text-sm">{item.label}</div>
                <div className="text-sm text-[#8E8EA0] mt-0.5">{item.number}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-[#F7F7F8] rounded-lg">
          <p className="text-xs text-[#8E8EA0] leading-relaxed">
            <strong className="text-[#40414F]">Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
