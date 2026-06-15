"use client";

import { RecommendationCategory } from "@/types/database";
import { getCategoryInfo } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: RecommendationCategory;
  count?: number;
  onClick?: () => void;
}

export function CategoryCard({ category, count, onClick }: CategoryCardProps) {
  const info = getCategoryInfo(category);
  const Icon = info.icon;

  return (
    <Card
      className="p-4 flex flex-col items-center gap-2 text-center"
      onClick={onClick}
    >
      <div className={cn("rounded-2xl p-3", info.bgColor)}>
        <Icon size={24} className={info.color} />
      </div>
      <div>
        <p className="font-medium text-charcoal text-sm">{info.pluralLabel}</p>
        {count !== undefined && count > 0 && (
          <p className="text-xs text-warm-gray-light mt-0.5">
            {count} friend{count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Card>
  );
}
