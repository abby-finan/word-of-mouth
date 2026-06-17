"use client";

import { RecommendationCategory } from "@/types/database";
import { TopRecommendation, formatTopRecommendationMeta } from "@/lib/top-recommendations";
import { getCategoryInfo, formatPhone } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Bookmark, Phone, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopRecommendationCardProps {
  top: TopRecommendation;
  category: RecommendationCategory;
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  secondary?: boolean;
}

export function TopRecommendationCard({
  top,
  category,
  isSaved = false,
  onSave,
  onUnsave,
  secondary = false,
}: TopRecommendationCardProps) {
  const categoryInfo = getCategoryInfo(category);

  return (
    <Card
      className={cn(
        "p-3",
        secondary
          ? "border-charcoal/5 bg-white"
          : "p-4 border-sage/20 bg-sage-light/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 rounded-xl",
            secondary ? "p-2" : "p-2.5",
            categoryInfo.bgColor
          )}
        >
          <categoryInfo.icon
            size={secondary ? 16 : 20}
            className={categoryInfo.color}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {!secondary && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={14} className="text-sage" />
                  <span className="text-xs font-medium text-sage uppercase tracking-wide">
                    Top pick
                  </span>
                </div>
              )}
              <p
                className={cn(
                  "font-semibold text-charcoal truncate",
                  secondary && "text-sm font-medium"
                )}
              >
                {top.provider_name}
              </p>
              <p className={cn("text-warm-gray", secondary ? "text-xs" : "text-sm")}>
                {formatTopRecommendationMeta(top)}
              </p>
            </div>

            {(onSave || onUnsave) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSaved) {
                    onUnsave?.();
                  } else {
                    onSave?.();
                  }
                }}
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg transition-colors",
                  isSaved
                    ? "text-sage bg-white"
                    : "text-warm-gray-light hover:text-sage hover:bg-white"
                )}
                aria-label={isSaved ? "Unsave" : "Save"}
              >
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          {top.note && (
            <p className="mt-2 text-sm text-warm-gray leading-relaxed line-clamp-2">
              {top.note}
            </p>
          )}

          {top.phone && (
            <a
              href={`tel:${top.phone}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-sage font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={14} />
              {formatPhone(top.phone)}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
