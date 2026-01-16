"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export function ZenHeader() {

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-30">
            {/* Left: Breadcrumbs / Navigation */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)] font-medium">MSME Mitr</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
                <span className="text-[var(--foreground)] font-medium bg-white/5 px-2 py-1 rounded-md">Chat</span>
            </div>

            {/* Right: Actions & Profile - Removed as per request */}
            <div className="flex items-center gap-3">
                {/* Profile section removed */}
            </div>
        </header>
    );
}
