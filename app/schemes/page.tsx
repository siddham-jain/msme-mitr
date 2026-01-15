"use client";

import { useState, useCallback } from "react";
import { ChatSidebar } from "@/components/mobile/ChatSidebar";
import { SchemeCard } from "@/components/mobile/SchemeCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter, Bot, Menu, Globe, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import schemesData from "@/data/schemes.json";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  "All",
  "Loan",
  "Subsidy",
  "Training",
  "Women",
  "Rural",
  "Startup",
];

const languages = [
  { code: "en", label: "English", labelLocal: "English" },
  { code: "hi", label: "Hindi", labelLocal: "हिंदी" },
];

export default function SchemesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredSchemes, setFilteredSchemes] = useState(schemesData.schemes);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default - focus on schemes
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Handle new chat - navigate to chat page
  const handleNewChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  // Handle chat selection - navigate to chat page with selected chat
  const handleSelectChat = useCallback((chatId: string) => {
    router.push("/chat");
  }, [router]);

  // Handle browse schemes - close sidebar (already on schemes page)
  const handleBrowseSchemes = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterSchemes(query, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterSchemes(searchQuery, category);
  };

  const filterSchemes = (query: string, category: string) => {
    let filtered = schemesData.schemes;

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (scheme) =>
          scheme.scheme_name.toLowerCase().includes(query.toLowerCase()) ||
          scheme.description.toLowerCase().includes(query.toLowerCase()) ||
          scheme.tags?.some((tag) =>
            tag.toLowerCase().includes(query.toLowerCase())
          )
      );
    }

    // Filter by category
    if (category !== "All") {
      filtered = filtered.filter((scheme) =>
        scheme.tags?.some((tag) =>
          tag.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    setFilteredSchemes(filtered);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
      {/* Top App Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-alt)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="icon-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-[var(--foreground)]" />
            <h1 className="text-lg font-bold text-[var(--foreground)]">MSME Mitr AI</h1>
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

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Sidebar - Collapsible on both mobile and desktop */}
        <aside
          className={`
            h-full flex-shrink-0
            w-[280px] lg:w-[320px]
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "ml-0" : "-ml-[280px] lg:-ml-[320px]"}
          `}
        >
          <ChatSidebar
            language={currentLanguage}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onBrowseSchemes={handleBrowseSchemes}
          />
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          {/* AI Assistant Prompt */}
          <Card className="bg-primary/5 border-primary/20 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2 flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Need help finding schemes?</p>
                <p className="text-xs text-muted-foreground">
                  Ask our AI assistant for personalized recommendations
                </p>
              </div>
              <Button 
                asChild
                size="sm"
                className="flex-shrink-0"
              >
                <Link href="/chat">
                  Chat Now
                </Link>
              </Button>
            </div>
          </Card>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search schemes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="px-3 py-1.5 cursor-pointer whitespace-nowrap"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSchemes.length} schemes found
            </p>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
          </div>

          {/* Schemes Grid - Responsive layout with auto-flow for expanded cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {filteredSchemes.length > 0 ? (
              filteredSchemes.map((scheme, index) => (
                <SchemeCard key={index} scheme={scheme} language="en" />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No schemes found matching your criteria
                </p>
                <Button asChild>
                  <Link href="/chat">Ask AI for Help</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}