"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InteractiveCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SchemeCardProps {
  scheme: {
    scheme_name: string;
    scheme_url: string;
    ministry: string;
    description: string;
    tags?: string[];
    details?: string;
    benefits?: string;
    eligibility?: string;
    application_process?: {
      content: string;
      has_tabs: boolean;
    } | null;
    documents_required?: string | null;
    faqs?: string | null;
    sources?: Array<{
      text: string;
      url: string;
    }>;
  };
  language?: string;
}

export function SchemeCard({ scheme, language = "en" }: SchemeCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    try {
      if (scheme.scheme_url) {
        window.open(scheme.scheme_url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback to local details page if scheme_url is not available
        const schemeId = encodeURIComponent(scheme.scheme_name);
        router.push(`/schemes/${schemeId}`);
      }
    } catch (error) {
      console.error('Failed to open scheme URL:', error);
      toast.error('Failed to open scheme details. Please try again.');
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Check if text is truncated
  const isNameTruncated = scheme.scheme_name.length > 80;
  const isDescriptionTruncated = scheme.description.length > 150;
  const showExpandButton = isNameTruncated || isDescriptionTruncated;

  return (
    <InteractiveCard 
      className={cn(
        "flex flex-col",
        isExpanded && "ring-2 ring-[var(--accent)]/20 shadow-xl z-10"
      )}
    >
      <CardHeader className="relative pb-3">
        {/* Ministry Badge */}
        <Badge variant="outline" className="w-fit mb-2">
          <Building className="w-3 h-3 mr-1" />
          {scheme.ministry}
        </Badge>
        
        {/* Scheme Name */}
        <CardTitle 
          className={cn(
            "text-lg transition-all duration-300 pr-8 text-[var(--foreground)]",
            isExpanded ? "" : "line-clamp-2",
            showExpandButton && "cursor-pointer hover:text-[var(--accent)]"
          )}
          onClick={showExpandButton ? toggleExpand : undefined}
        >
          {scheme.scheme_name}
        </CardTitle>
        
        {/* Description */}
        <CardDescription 
          className={cn(
            "mt-2 transition-all duration-300",
            isExpanded ? "max-h-none" : "line-clamp-3",
            showExpandButton && "cursor-pointer hover:text-foreground/80"
          )}
          onClick={showExpandButton ? toggleExpand : undefined}
        >
          {scheme.description}
        </CardDescription>

        {/* Expand/Collapse Button */}
        {showExpandButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-white/5"
            onClick={toggleExpand}
            aria-label={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
            )}
          </Button>
        )}

        {/* Visual indicator for expandable content */}
        {showExpandButton && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        {/* Tags Display */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(isExpanded ? scheme.tags : scheme.tags.slice(0, 5)).map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="secondary"
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {!isExpanded && scheme.tags.length > 5 && (
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={toggleExpand}
              >
                +{scheme.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-4">
        {/* View Details Button */}
        <Button 
          className="w-full" 
          onClick={handleViewDetails}
        >
          View Details
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </InteractiveCard>
  );
}