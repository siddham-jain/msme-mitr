'use client';

import * as React from 'react';
import { Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  position?: 'nav' | 'standalone';
}

/**
 * ThemeToggle - Currently displays dark theme indicator
 * 
 * In the Minimalist Dark design, this component shows the current theme
 * without toggle functionality. The component structure is preserved
 * for future light mode support.
 * 
 * Requirements: 14.1, 14.2
 */
export function ThemeToggle({ size = 'md', className, position = 'standalone' }: ThemeToggleProps) {
  const { theme } = useTheme();

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-full flex items-center justify-center',
        'transition-all duration-300 ease-out',
        // Glass effect background matching dark theme
        'bg-[var(--card)] backdrop-blur-[8px]',
        'border border-[var(--border)]',
        sizeClasses[size],
        className
      )}
      aria-label="Dark theme active"
      role="status"
      whileHover={{ scale: 1.05 }}
    >
      {/* Moon icon indicating dark theme */}
      <motion.div
        className="flex items-center justify-center text-[var(--muted-foreground)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Moon className={iconSizes[size]} aria-hidden="true" />
      </motion.div>

      {/* Screen reader text */}
      <span className="sr-only">Dark theme is active</span>

      {/* Subtle ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none bg-[var(--accent)]/5"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
