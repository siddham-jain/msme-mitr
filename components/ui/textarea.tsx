import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base - min-h-[44px] for touch-friendly targets, rounded-lg (12px) border radius
        "min-h-[44px] w-full rounded-lg px-4 py-3 text-sm",
        // Glass effect background - semi-transparent matching card/input style
        "bg-[var(--input)] backdrop-blur-[8px]",
        // Border
        "border border-[var(--input-border)]",
        // Text colors - placeholder in muted foreground
        "text-[var(--foreground)]",
        "placeholder:text-[var(--muted-foreground)]",
        // Resize - disabled by default
        "resize-none",
        // Transitions - 200ms for focus state changes
        "transition-all duration-200 ease-out",
        // Focus state - subtle glow effect and brightened border
        "focus:border-[var(--ring)]/50",
        "focus:ring-2 focus:ring-[var(--ring-muted)]",
        "focus:outline-none",
        // Selection styling
        "selection:bg-primary selection:text-primary-foreground",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Error state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
