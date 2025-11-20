'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

export default function TestThemePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Theme Test Page</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Current Theme</h2>
            <p className="text-muted-foreground">
              Active theme: <span className="font-mono font-bold">{theme}</span>
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Theme Controls</h2>
            <div className="flex gap-4 items-center">
              <ThemeToggle size="default" />
              <Button onClick={() => setTheme('light')} variant="outline">
                Set Light
              </Button>
              <Button onClick={() => setTheme('dark')} variant="outline">
                Set Dark
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Persistence Test</h2>
            <p className="text-sm text-muted-foreground">
              Toggle the theme and reload the page. The theme should persist.
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Visual Elements</h2>
            <div className="space-y-2">
              <p className="text-foreground">Primary text color</p>
              <p className="text-muted-foreground">Muted text color</p>
              <div className="p-2 bg-primary text-primary-foreground rounded">
                Primary background
              </div>
              <div className="p-2 bg-muted text-muted-foreground rounded">
                Muted background
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
