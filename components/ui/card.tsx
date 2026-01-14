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
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
