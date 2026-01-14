'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  position?: 'nav' | 'standalone';
}

export function ThemeToggle({ size = 'md', className, position = 'standalone' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isFlipping, setIsFlipping] = React.useState(false);

  const toggleTheme = () => {
    if (isFlipping) return; // Prevent multiple clicks during animation
    
    setIsFlipping(true);
    setTheme(theme === 'dark' ? 'light' : 'dark');
    
    // Reset flip state after animation completes
    setTimeout(() => setIsFlipping(false), 400);
  };

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
    <motion.button
      onClick={toggleTheme}
      disabled={isFlipping}
      className={cn(
        'relative rounded-full flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        // Background with smooth color transitions
        'admin-transition-colors',
        theme === 'dark' 
          ? 'bg-admin-bg-elevated hover:bg-admin-bg-secondary' 
          : 'bg-admin-bg-elevated hover:bg-admin-bg-secondary',
        // Border with theme-specific colors
        theme === 'dark'
          ? 'border-2 border-admin-accent-primary/20 hover:border-admin-accent-primary/40'
          : 'border-2 border-admin-accent-primary/20 hover:border-admin-accent-primary/40',
        // Glow effect matching current theme
        theme === 'dark'
          ? 'shadow-[0_0_15px_rgba(255,0,255,0.2)] hover:shadow-[0_0_25px_rgba(255,0,255,0.4)]'
          : 'shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:shadow-[0_0_25px_rgba(0,255,65,0.4)]',
        // Focus ring
        theme === 'dark'
          ? 'focus-visible:ring-admin-accent-primary'
          : 'focus-visible:ring-admin-accent-primary',
        sizeClasses[size],
        className
      )}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'dark'}
      role="switch"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        rotateY: isFlipping ? 180 : 0,
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Icon container with fade transition */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 90 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center justify-center',
            theme === 'dark' ? 'text-admin-accent-primary' : 'text-admin-accent-primary'
          )}
        >
          {theme === 'dark' ? (
            <Sun className={iconSizes[size]} aria-hidden="true" />
          ) : (
            <Moon className={iconSizes[size]} aria-hidden="true" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Screen reader text */}
      <span className="sr-only">
        {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>

      {/* Animated glow pulse effect */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full pointer-events-none',
          theme === 'dark'
            ? 'bg-admin-accent-primary/10'
            : 'bg-admin-accent-primary/10'
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
}
