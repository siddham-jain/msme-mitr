import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card Component with Glass Effect
 * 
 * Implements the Minimalist Dark design system glass card styling:
 * - Semi-transparent background rgba(26, 26, 36, 0.6)
 * - Backdrop blur of 8px
 * - Subtle border at 8% white opacity
 * - Rounded-lg (12px) border radius
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Glass effect base - Requirements 4.1, 4.2
        "bg-[rgba(26,26,36,0.6)] backdrop-blur-[8px]",
        // Border at 8% white opacity - Requirement 4.3
        "border border-[rgba(255,255,255,0.08)]",
        // Rounded-lg (12px) border radius - Requirement 4.4
        "rounded-lg",
        // Text and layout
        "text-[var(--card-foreground,#FAFAFA)]",
        "flex flex-col gap-6 py-6",
        // Base transition for smooth state changes
        "transition-all duration-300 ease-out",
        className
      )}
      {...props}
    />
  )
}

/**
 * Interactive Card Component with Hover Effects
 * 
 * Extends the base Card with interactive hover states:
 * - Hover border brightening to 15% opacity
 * - Hover scale (1.02) transform
 * - 300ms ease-out transitions
 * 
 * Requirements: 4.5, 4.6, 4.7
 */
function InteractiveCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="interactive-card"
      className={cn(
        // Glass effect base - Requirements 4.1, 4.2
        "bg-[rgba(26,26,36,0.6)] backdrop-blur-[8px]",
        // Border at 8% white opacity - Requirement 4.3
        "border border-[rgba(255,255,255,0.08)]",
        // Rounded-lg (12px) border radius - Requirement 4.4
        "rounded-lg",
        // Text and layout
        "text-[var(--card-foreground,#FAFAFA)]",
        "flex flex-col gap-6 py-6",
        // Interactive cursor
        "cursor-pointer",
        // 300ms ease-out transitions - Requirement 4.7
        "transition-all duration-300 ease-out",
        // Hover effects - Requirements 4.5, 4.6
        "hover:border-[rgba(255,255,255,0.15)]",
        "hover:bg-[rgba(26,26,36,0.8)]",
        "hover:scale-[1.02]",
        "hover:shadow-[0_10px_15px_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  InteractiveCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
