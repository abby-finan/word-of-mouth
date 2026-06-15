"use client";

import { Recommendation, Profile } from "@/types/database";
import { getCategoryInfo, formatPhone } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Bookmark, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: Recommendation;
  profile?: Profile;
  onSave?: () => void;
  onUnsave?: () => void;
  isSaved?: boolean;
  showFriend?: boolean;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  profile,
  onSave,
  onUnsave,
  isSaved = false,
  showFriend = true,
  compact = false,
}: RecommendationCardProps) {
  const category = getCategoryInfo(recommendation.category);

  return (
    <Card className={cn("p-4", compact && "p-3")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 rounded-xl p-2.5",
            category.bgColor
          )}
        >
          <category.icon size={compact ? 18 : 20} className={category.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-charcoal truncate">
                {recommendation.provider_name}
              </p>
              <p className="text-sm text-warm-gray">{category.label}</p>
            </div>

            {(onSave || onUnsave) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isSaved ? onUnsave?.() : onSave?.();
                }}
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg transition-colors",
                  isSaved
                    ? "text-sage bg-sage-light"
                    : "text-warm-gray-light hover:text-sage hover:bg-sage-light"
                )}
                aria-label={isSaved ? "Unsave" : "Save"}
              >
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          {showFriend && profile && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar name={profile.first_name} src={profile.avatar_url} size="sm" />
              <span className="text-sm text-warm-gray">
                Recommended by {profile.first_name}
              </span>
            </div>
          )}

          {recommendation.note && (
            <p className="mt-2 text-sm text-warm-gray leading-relaxed">
              {recommendation.note}
            </p>
          )}

          {recommendation.how_i_know_them && (
            <p className="mt-1 text-xs text-warm-gray-light italic">
              {recommendation.how_i_know_them}
            </p>
          )}

          {recommendation.phone && (
            <a
              href={`tel:${recommendation.phone}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-sage font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={14} />
              {formatPhone(recommendation.phone)}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
