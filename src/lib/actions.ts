"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, Recommendation, RecommendationCategory } from "@/types/database";
import { CATEGORIES } from "@/lib/constants";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getMyRecommendations(): Promise<Recommendation[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("recommendations")
    .select("*")
    .eq("user_id", user.id)
    .order("category");

  return data ?? [];
}

export async function getFriendRecommendations(
  category?: RecommendationCategory
): Promise<(Recommendation & { profile: Profile })[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("recommendations")
    .select("*, profile:profiles(*)")
    .neq("user_id", user.id);

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query.order("category");
  return (data ?? []) as (Recommendation & { profile: Profile })[];
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const recommendations = await getFriendRecommendations();
  const counts: Record<string, number> = {};

  for (const rec of recommendations) {
    counts[rec.category] = (counts[rec.category] || 0) + 1;
  }

  return counts;
}

export async function getSavedRecommendationIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("saved_recommendations")
    .select("recommendation_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((s) => s.recommendation_id));
}

export async function saveRecommendation(recommendationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("saved_recommendations").insert({
    user_id: user.id,
    recommendation_id: recommendationId,
  });
}

export async function unsaveRecommendation(recommendationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_recommendations")
    .delete()
    .eq("user_id", user.id)
    .eq("recommendation_id", recommendationId);
}

export async function upsertRecommendation(
  category: RecommendationCategory,
  data: {
    provider_name: string;
    phone?: string;
    note?: string;
    how_i_know_them?: string;
  }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("recommendations").upsert(
    {
      user_id: user.id,
      category,
      provider_name: data.provider_name,
      phone: data.phone || null,
      note: data.note || null,
      how_i_know_them: data.how_i_know_them || null,
    },
    { onConflict: "user_id,category" }
  );

  return { error: error?.message };
}

export async function deleteRecommendation(category: RecommendationCategory) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("recommendations")
    .delete()
    .eq("user_id", user.id)
    .eq("category", category);
}

export async function updateProfile(data: {
  first_name?: string;
  city?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  return { error: error?.message };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export { CATEGORIES };
