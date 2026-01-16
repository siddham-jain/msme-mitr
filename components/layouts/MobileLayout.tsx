"use client";

import React from "react";
import { MobileNav } from "@/components/mobile/MobileNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
  onMenuClick?: () => void;
}

export function MobileLayout({
  children,
  showBottomNav = true,
  className = "",
  onMenuClick,
}: MobileLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background bg-zen-gradient overflow-hidden">
      {/* Mobile Navigation - Header at top, navigation in sidebar */}
      <MobileNav onMenuClick={onMenuClick} />

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden ${className}`}>
        {children}
      </main>
    </div>
  );
}