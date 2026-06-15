"use client";

import { useEffect, useState } from "react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { getSavedRecommendations } from "@/lib/friends";
import { unsaveRecommendation } from "@/lib/actions";
import { Recommendation, Profile } from "@/types/database";

export default function SavedPage() {
  const [saved, setSaved] = useState<
    (Recommendation & { profile: Profile; savedId: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSavedRecommendations();
      setSaved(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUnsave(recommendationId: string) {
    await unsaveRecommendation(recommendationId);
    setSaved((prev) => prev.filter((s) => s.id !== recommendationId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-light">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-charcoal tracking-tight">
          Saved
        </h1>
        <p className="text-sm text-warm-gray mt-1">
          Your trusted shortlist
        </p>
      </div>

      <div className="px-5 space-y-3">
        {saved.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-warm-gray text-sm leading-relaxed">
              Save recommendations from friends to build your personal shortlist
              of trusted providers.
            </p>
          </div>
        ) : (
          saved.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              profile={rec.profile}
              isSaved={true}
              onUnsave={() => handleUnsave(rec.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
