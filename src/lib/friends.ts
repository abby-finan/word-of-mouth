"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, Friendship, Recommendation } from "@/types/database";

export async function getFriends(): Promise<
  (Friendship & { friend: Profile; recommendationCount: number })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (!friendships) return [];

  const friends = await Promise.all(
    friendships.map(async (f) => {
      const friendId =
        f.requester_id === user.id ? f.addressee_id : f.requester_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", friendId)
        .single();

      const { count } = await supabase
        .from("recommendations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", friendId);

      return {
        ...f,
        friend: profile!,
        recommendationCount: count ?? 0,
      };
    })
  );

  return friends.filter((f) => f.friend);
}

export async function getPendingRequests(): Promise<
  (Friendship & { requester: Profile })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  return (data ?? []) as (Friendship & { requester: Profile })[];
}

export async function getSentRequests(): Promise<
  (Friendship & { addressee: Profile })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friendships")
    .select("*, addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("requester_id", user.id)
    .eq("status", "pending");

  return (data ?? []) as (Friendship & { addressee: Profile })[];
}

export async function searchUserByEmail(
  email: string
): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_users_by_email", {
    search_email: email,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as Profile;
}

export async function sendFriendRequest(addresseeId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
  });

  return { error: error?.message };
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);

  return { error: error?.message };
}

export async function removeFriend(friendshipId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  return { error: error?.message };
}

export async function getFriendProfile(
  friendId: string
): Promise<{ profile: Profile; recommendations: Recommendation[] } | null> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", friendId)
    .single();

  if (!profile) return null;

  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("user_id", friendId)
    .order("category");

  return {
    profile,
    recommendations: recommendations ?? [],
  };
}

export async function getSavedRecommendations(): Promise<
  (Recommendation & { profile: Profile; savedId: string })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_recommendations")
    .select("id, recommendation:recommendations(*, profile:profiles(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((item) => ({
    ...(item.recommendation as Recommendation & { profile: Profile }),
    savedId: item.id,
  }));
}
