'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Model {
  id: string
  name: string
  description: string
}

const models: Model[] = [
  { id: 'gpt-4o-mini', name: 'ChatGPT 4o mini', description: 'Great for everyday tasks' },
  { id: 'gpt-4o', name: 'ChatGPT 4o', description: 'Our smartest model' },
  { id: 'gpt-3.5-turbo', name: 'ChatGPT 3.5', description: 'Fast and efficient' },
]

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(models[2]) // Default to 3.5

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-[16px] font-semibold text-[#40414F]">
          {selectedModel.name}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-[#8E8EA0] transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-xl shadow-lg border border-[#E5E7EB] z-50 py-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F7F7F8] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#40414F]">
                      {model.name}
                    </span>
                    {selectedModel.id === model.id && (
                      <Check className="w-4 h-4 text-[#10A37F]" />
                    )}
                  </div>
                  <p className="text-[12px] text-[#8E8EA0] mt-0.5">
                    {model.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
