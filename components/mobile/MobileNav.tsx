"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageCircle,
  Search,
  Bookmark,
  History,
  User,
  Menu,
  X,
  Phone,
  Globe,
  Bot,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavItem {
  label: string;
  labelHi?: string;
  href: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  onMenuClick?: () => void;
}

const navItems: NavItem[] = [
  {
    label: "AI Chat",
    labelHi: "AI चैट",
    href: "/chat",
    icon: <Bot className="w-5 h-5" />,
  },
  {
    label: "Schemes",
    labelHi: "योजनाएं",
    href: "/schemes",
    icon: <Search className="w-5 h-5" />,
  },
  {
    label: "Saved",
    labelHi: "सहेजा गया",
    href: "/saved",
    icon: <Bookmark className="w-5 h-5" />,
  },
  {
    label: "History",
    labelHi: "इतिहास",
    href: "/history",
    icon: <History className="w-5 h-5" />,
  },
  {
    label: "Profile",
    labelHi: "प्रोफाइल",
    href: "/profile",
    icon: <User className="w-5 h-5" />,
  },
];

const languages = [
  { code: "en", label: "English", labelLocal: "English" },
  { code: "hi", label: "Hindi", labelLocal: "हिंदी" },
  { code: "ta", label: "Tamil", labelLocal: "தமிழ்" },
  { code: "te", label: "Telugu", labelLocal: "తెలుగు" },
  { code: "bn", label: "Bengali", labelLocal: "বাংলা" },
  { code: "gu", label: "Gujarati", labelLocal: "ગુજરાતી" },
  { code: "kn", label: "Kannada", labelLocal: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", labelLocal: "മലയാളം" },
  { code: "mr", label: "Marathi", labelLocal: "मराठी" },
  { code: "or", label: "Odia", labelLocal: "ଓଡିଆ" },
  { code: "pa", label: "Punjabi", labelLocal: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", labelLocal: "اردو" },
];

export function MobileNav({ onMenuClick }: MobileNavProps = {}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const { signOut, user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setIsMenuOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* Top App Bar */}
      <header className="app-bar flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="icon-btn"
            onClick={handleMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-primary">MSME Mitr AI</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
            <SelectTrigger className="w-24 h-10 text-sm">
              <Globe className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.labelLocal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            className="icon-btn"
            aria-label="Help"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Side Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[80vw] max-w-[320px] sm:w-[320px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-6 border-b bg-primary text-primary-foreground">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <span>MSME Mitr AI</span>
            </SheetTitle>
            <p className="text-sm opacity-90 mt-1">
              Your AI Business Advisor
            </p>
          </SheetHeader>

          <nav className="flex-1 flex flex-col py-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-6 py-4 text-base transition-colors
                    ${
                      active
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "hover:bg-muted"
                    }
                  `}
                >
                  <span className={active ? "text-primary" : ""}>
                    {item.icon}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    {currentLanguage === "hi" && item.labelHi
                      ? item.labelHi
                      : item.label}
                  </span>
                </Link>
              );
            })}

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-6 py-4 text-base transition-colors hover:bg-muted mt-auto"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium whitespace-nowrap">
                  {currentLanguage === "hi" ? "लॉग आउट" : "Logout"}
                </span>
              </button>
            )}
          </nav>

          <div className="p-4 border-t bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Ministry of MSME
              <br />
              Government of India
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}