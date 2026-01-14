import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base - h-11 (44px) for touch-friendly targets, rounded-lg (12px) border radius
        "h-11 w-full min-w-0 rounded-lg px-4 text-sm",
        // Glass effect background - semi-transparent matching card style
        "bg-[var(--input)] backdrop-blur-[8px]",
        // Border
        "border border-[var(--input-border)]",
        // Text colors - placeholder in muted foreground
        "text-[var(--foreground)]",
        "placeholder:text-[var(--muted-foreground)]",
        // Transitions - 200ms for focus state changes
        "transition-all duration-200 ease-out",
        // Focus state - subtle glow effect and brightened border
        "focus:border-[var(--ring)]/50",
        "focus:ring-2 focus:ring-[var(--ring-muted)]",
        "focus:outline-none",
        // Selection styling
        "selection:bg-primary selection:text-primary-foreground",
        // File input styling
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
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

export { Input }
