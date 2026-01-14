'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme type - currently dark-only, but structured to support future light mode
 * The type union allows for future extensibility without breaking changes
 */
type Theme = 'dark' | 'light';

interface ThemeContextType {
  /** Current theme - always 'dark' in this version */
  theme: Theme;
  /** 
   * Set theme function - exposed for future light mode support
   * Currently stores preference but always applies dark theme
   */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider - Manages dark theme application
 * 
 * Current behavior (Minimalist Dark design):
 * - Always applies dark theme
 * - Stores preference in localStorage for future light mode support
 * - Initializes before React hydration via script in layout.tsx
 * - Gracefully handles localStorage unavailability
 * 
 * Requirements: 1.8, 14.1, 14.3, 14.5, 14.6
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with dark theme - this is the only supported theme currently
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Apply dark theme on mount
    // The script in layout.tsx handles pre-hydration to prevent flash
    try {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      
      // Store dark theme preference for future light mode support
      localStorage.setItem('theme', 'dark');
    } catch (error) {
      // Gracefully handle localStorage unavailability (Requirement 14.6)
      console.warn('Failed to apply theme:', error);
      // CSS will still work via the pre-hydration script
    }
  }, []);

  /**
   * setTheme - Stores preference but always applies dark theme
   * This maintains the API for future light mode support while
   * ensuring consistent dark-only behavior in current version
   */
  const setTheme = (newTheme: Theme) => {
    // Store the preference for future light mode support
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
    
    // Always apply dark theme in current version
    setThemeState('dark');
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme hook - Access theme state and setter
 * 
 * Returns:
 * - theme: Current theme (always 'dark' in this version)
 * - setTheme: Function to set theme preference
 * 
 * Requirement 14.2: Exposes useTheme hook for components
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
