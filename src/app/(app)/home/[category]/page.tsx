"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import {
  getFriendRecommendations,
  getSavedRecommendationIds,
  saveRecommendation,
  unsaveRecommendation,
} from "@/lib/actions";
import { getCategoryInfo } from "@/lib/constants";
import { Recommendation, Profile, RecommendationCategory } from "@/types/database";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as RecommendationCategory;
  const info = getCategoryInfo(category);

  const [recommendations, setRecommendations] = useState<
    (Recommendation & { profile: Profile })[]
  >([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [recs, saved] = await Promise.all([
        getFriendRecommendations(category),
        getSavedRecommendationIds(),
      ]);
      setRecommendations(recs);
      setSavedIds(saved);
      setLoading(false);
    }
    load();
  }, [category]);

  async function handleSave(id: string) {
    await saveRecommendation(id);
    setSavedIds((prev) => new Set([...prev, id]));
  }

  async function handleUnsave(id: string) {
    await unsaveRecommendation(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <>
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-warm-gray text-sm mb-4 hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${info.bgColor}`}>
            <info.icon size={28} className={info.color} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-charcoal tracking-tight">
              {info.pluralLabel}
            </h1>
            <p className="text-sm text-warm-gray">
              {recommendations.length} recommendation
              {recommendations.length !== 1 ? "s" : ""} from friends
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-warm-gray-light animate-pulse">
            Loading...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-warm-gray text-sm leading-relaxed">
              No friends have shared a {info.label.toLowerCase()} yet. Ask your
              friends to add their trusted {info.label.toLowerCase()}!
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              profile={rec.profile}
              isSaved={savedIds.has(rec.id)}
              onSave={() => handleSave(rec.id)}
              onUnsave={() => handleUnsave(rec.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
