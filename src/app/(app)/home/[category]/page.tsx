"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { TopRecommendationCard } from "@/components/recommendations/TopRecommendationCard";
import {
  getCurrentProfile,
  getFriendRecommendations,
  getTopRecommendations,
  getSavedRecommendationIds,
  saveRecommendation,
  unsaveRecommendation,
} from "@/lib/actions";
import { getCategoryInfo, getCategoryFriendsEmptyState } from "@/lib/constants";
import { formatProfileLocation } from "@/lib/location";
import { TopRecommendation } from "@/lib/top-recommendations";
import { Recommendation, Profile, RecommendationCategory } from "@/types/database";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as RecommendationCategory;
  const info = getCategoryInfo(category);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [topRecommendations, setTopRecommendations] = useState<TopRecommendation[]>([]);
  const [recommendations, setRecommendations] = useState<
    (Recommendation & { profile: Profile })[]
  >([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const locationLabel = formatProfileLocation(profile);

  useEffect(() => {
    async function load() {
      const [currentProfile, top, recs, saved] = await Promise.all([
        getCurrentProfile(),
        getTopRecommendations(category),
        getFriendRecommendations(category),
        getSavedRecommendationIds(),
      ]);
      setProfile(currentProfile);
      setTopRecommendations(top);
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
            {info.description && (
              <p className="text-sm text-warm-gray mt-0.5">{info.description}</p>
            )}
            <p className="text-sm text-warm-gray mt-0.5">
              {recommendations.length} recommendation
              {recommendations.length !== 1 ? "s" : ""} from friends
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-8">
        {loading ? (
          <div className="text-center py-12 text-warm-gray-light animate-pulse">
            Loading...
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-base font-semibold text-charcoal mb-3">
                From your friends
              </h2>

              {recommendations.length === 0 ? (
                <p className="text-sm text-warm-gray leading-relaxed text-center py-8 px-2">
                  {getCategoryFriendsEmptyState(category)}
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      profile={rec.profile}
                      isSaved={savedIds.has(rec.id)}
                      onSave={() => handleSave(rec.id)}
                      onUnsave={() => handleUnsave(rec.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {topRecommendations.length > 0 && (
              <section className="pt-2 border-t border-charcoal/5">
                <h2 className="text-sm font-medium text-warm-gray mb-1">
                  From other people in your area
                </h2>
                {locationLabel && (
                  <p className="text-xs text-warm-gray-light mb-3">
                    Popular in {locationLabel}
                  </p>
                )}
                <div className="space-y-2">
                  {topRecommendations.map((top) => (
                    <TopRecommendationCard
                      key={top.recommendation_id}
                      top={top}
                      category={category}
                      secondary
                      isSaved={savedIds.has(top.recommendation_id)}
                      onSave={() => handleSave(top.recommendation_id)}
                      onUnsave={() => handleUnsave(top.recommendation_id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
