import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Requirements 3.1, 3.2, 3.7
  // h-11 (44px) default height for touch-friendly targets
  // rounded-lg (12px) border radius
  // 200ms ease-out transitions for all state changes
  `inline-flex items-center justify-center gap-2 whitespace-nowrap 
   font-medium transition-all duration-200 ease-out outline-none
   disabled:pointer-events-none disabled:opacity-50
   [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 
   shrink-0 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // Primary - White button on dark background (Minimalist Dark design)
        // Requirements: 3.5
        default: `bg-[var(--primary)] text-[var(--primary-foreground)] 
                  shadow-[var(--shadow-sm)]`,
        
        // Secondary - Elevated dark surface
        // Requirements: 3.5
        secondary: `bg-[var(--secondary)] text-[var(--secondary-foreground)]
                    border border-[var(--border)]`,
        
        // Outline - Transparent with border
        // Requirements: 3.5
        outline: `bg-transparent text-[var(--foreground)]
                  border border-[var(--border)]`,
        
        // Ghost - No background until hover
        // Requirements: 3.5
        ghost: `bg-transparent text-[var(--foreground)]`,
        
        // Destructive
        // Requirements: 3.5
        destructive: `bg-[var(--destructive)] text-[var(--destructive-foreground)]`,
        
        // Link style
        link: `text-[var(--foreground)] underline-offset-4 hover:underline`,
      },
      size: {
        // Default h-11 (44px) for touch-friendly targets - Requirement 3.1
        default: "h-11 px-6 py-3 rounded-lg text-sm",
        sm: "h-9 px-4 py-2 rounded-md text-sm",
        lg: "h-12 px-8 py-3 rounded-lg text-base",
        // Icon sizes with rounded-lg
        icon: "size-11 rounded-lg",
        "icon-sm": "size-9 rounded-md",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
