"use client";

import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber } from "@/lib/phone";
import { Profile, Recommendation, RecommendationCategory } from "@/types/database";
import { TopRecommendation } from "@/lib/top-recommendations";
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

export async function getTopRecommendations(
  category: RecommendationCategory,
  limit = 5
): Promise<TopRecommendation[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_top_recommendations", {
    p_category: category,
    p_limit: limit,
  });

  if (error) {
    console.error("[WOM Top] get_top_recommendations error:", error);
    return [];
  }

  return (data ?? []).map(
    (row: {
      provider_name: string;
      phone: string | null;
      note: string | null;
      recommendation_count: number;
      friend_recommendation_count: number;
      score: number;
      recommendation_id: string;
    }) => ({
      provider_name: row.provider_name,
      phone: row.phone ?? null,
      note: row.note ?? null,
      recommendation_count: Number(row.recommendation_count ?? 0),
      friend_recommendation_count: Number(row.friend_recommendation_count ?? 0),
      score: Number(row.score ?? 0),
      recommendation_id: row.recommendation_id,
    })
  );
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
    .select("*")
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
  neighborhood?: string;
  avatar_url?: string;
  phone_number?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, string | null> = {};

  if (data.first_name !== undefined) {
    updates.first_name = data.first_name.trim();
  }
  if (data.city !== undefined) {
    updates.city = data.city.trim() || null;
  }
  if (data.neighborhood !== undefined) {
    updates.neighborhood = data.neighborhood.trim() || null;
  }
  if (data.avatar_url !== undefined) {
    updates.avatar_url = data.avatar_url || null;
  }
  if (data.phone_number !== undefined) {
    const trimmed = data.phone_number.trim();
    if (!trimmed) {
      updates.phone_number = null;
    } else {
      const normalized = normalizePhoneNumber(trimmed);
      if (!normalized) {
        return { error: "Enter a valid phone number." };
      }
      updates.phone_number = normalized;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  return { error: error?.message };
}

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProfileAvatar(
  file: File
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: "Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be under 5 MB." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[WOM Profile] avatar upload error:", uploadError);
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
  if (updateError) {
    return { error: updateError };
  }

  return { url: publicUrl };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export { CATEGORIES };
