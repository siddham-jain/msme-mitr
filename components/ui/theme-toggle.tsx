'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ThemeToggle({ size = 'default', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Map size prop to button size variant
  const buttonSize = size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon';

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={toggleTheme}
      className={cn('transition-transform hover:scale-105', className)}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'dark'}
      role="switch"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  );
}
