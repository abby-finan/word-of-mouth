"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { getFriendProfile, removeFriend } from "@/lib/friends";
import {
  getSavedRecommendationIds,
  saveRecommendation,
  unsaveRecommendation,
} from "@/lib/actions";
import { Profile, Recommendation } from "@/types/database";
import { formatProfileLocation } from "@/lib/location";

export default function FriendProfilePage() {
  const params = useParams();
  const router = useRouter();
  const friendId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  useEffect(() => {
    async function load() {
      const [data, saved] = await Promise.all([
        getFriendProfile(friendId),
        getSavedRecommendationIds(),
      ]);
      if (data) {
        setProfile(data.profile);
        setRecommendations(data.recommendations);
        setFriendshipId(data.friendshipId);
      }
      setSavedIds(saved);
      setLoading(false);
    }
    load();
  }, [friendId]);

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

  async function handleRemoveFriend() {
    if (!friendshipId) return;

    setRemoving(true);
    setRemoveError("");

    try {
      const { error } = await removeFriend(friendshipId);
      if (error) {
        setRemoveError("Couldn't remove that friend. Please try again.");
        return;
      }

      router.push("/friends");
      router.refresh();
    } catch (error) {
      console.error("[WOM Friends] handleRemoveFriend error:", error);
      setRemoveError("Couldn't remove that friend. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-light">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-warm-gray">Friend not found.</div>
    );
  }

  return (
    <>
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-warm-gray text-sm mb-6 hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Avatar
            name={profile.first_name}
            src={profile.avatar_url}
            size="xl"
          />
          <h1 className="text-2xl font-semibold text-charcoal mt-3">
            {profile.first_name}&apos;s trusted people
          </h1>
          {formatProfileLocation(profile) && (
            <p className="text-sm text-warm-gray mt-1">
              {formatProfileLocation(profile)}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-warm-gray text-sm">
              {profile.first_name} hasn&apos;t added any recommendations yet.
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              showFriend={false}
              isSaved={savedIds.has(rec.id)}
              onSave={() => handleSave(rec.id)}
              onUnsave={() => handleUnsave(rec.id)}
            />
          ))
        )}
      </div>

      {friendshipId && (
        <div className="px-5 pt-6 pb-8">
          {removeError && (
            <p className="mb-3 text-center text-sm text-red-500">{removeError}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-warm-gray-light hover:text-red-600"
            loading={removing}
            onClick={handleRemoveFriend}
          >
            Remove friend
          </Button>
        </div>
      )}
    </>
  );
}
