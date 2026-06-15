"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, Friendship, Recommendation } from "@/types/database";

const UNKNOWN_PROFILE: Profile = {
  id: "",
  first_name: "Unknown user",
  city: null,
  neighborhood: null,
  avatar_url: null,
  created_at: "",
  updated_at: "",
};

function placeholderProfile(userId: string, label = "Unknown user"): Profile {
  return {
    ...UNKNOWN_PROFILE,
    id: userId,
    first_name: label,
  };
}

function isValidProfile(profile: Profile | null | undefined): profile is Profile {
  return Boolean(profile?.id && profile?.first_name);
}

export async function getFriends(): Promise<
  (Friendship & { friend: Profile; recommendationCount: number })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) {
    console.error("[WOM Friends] getFriends error:", error);
    return [];
  }

  if (!friendships?.length) return [];

  const friends = await Promise.all(
    friendships.map(async (f) => {
      const friendId =
        f.requester_id === user.id ? f.addressee_id : f.requester_id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", friendId)
        .maybeSingle();

      if (profileError) {
        console.error("[WOM Friends] profile fetch error:", profileError);
      }

      const { count } = await supabase
        .from("recommendations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", friendId);

      const friend = isValidProfile(profile)
        ? profile
        : placeholderProfile(friendId, "Friend");

      return {
        ...f,
        friend,
        recommendationCount: count ?? 0,
      };
    })
  );

  return friends;
}

export async function getPendingRequests(): Promise<
  (Friendship & { requester: Profile })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("*, requester:profiles!friendships_requester_id_fkey(*)")
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("[WOM Friends] getPendingRequests error:", error);
    return [];
  }

  if (!data?.length) return [];

  const requests = await Promise.all(
    data.map(async (row) => {
      const friendship = row as Friendship & { requester: Profile | null };
      let requester = friendship.requester;

      if (!isValidProfile(requester)) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", friendship.requester_id)
          .maybeSingle();

        if (profileError) {
          console.error("[WOM Friends] requester profile fetch error:", profileError);
        }

        requester = isValidProfile(profile)
          ? profile
          : placeholderProfile(friendship.requester_id, "Someone");
      }

      return {
        ...friendship,
        requester,
      };
    })
  );

  return requests;
}

export async function getSentRequests(): Promise<
  (Friendship & { addressee: Profile })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select("*, addressee:profiles!friendships_addressee_id_fkey(*)")
    .eq("requester_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("[WOM Friends] getSentRequests error:", error);
    return [];
  }

  if (!data?.length) return [];

  return data.map((row) => {
    const friendship = row as Friendship & { addressee: Profile | null };
    const addressee = isValidProfile(friendship.addressee)
      ? friendship.addressee
      : placeholderProfile(friendship.addressee_id, "Friend");

    return {
      ...friendship,
      addressee,
    };
  });
}

export async function searchUserByEmail(
  email: string
): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_users_by_email", {
    search_email: email,
  });

  if (error || !data || data.length === 0) return null;
  const profile = data[0] as Profile;
  return isValidProfile(profile) ? profile : null;
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", friendId)
    .maybeSingle();

  if (error) {
    console.error("[WOM Friends] getFriendProfile error:", error);
  }

  if (!isValidProfile(profile)) return null;

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

  const { data, error } = await supabase
    .from("saved_recommendations")
    .select("id, recommendation:recommendations(*, profile:profiles(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[WOM Friends] getSavedRecommendations error:", error);
    return [];
  }

  if (!data?.length) return [];

  return data
    .map((item) => {
      const recommendation = item.recommendation as unknown as
        | (Recommendation & { profile: Profile | null })
        | null;

      if (!recommendation?.id || !recommendation.provider_name) {
        return null;
      }

      const profile = isValidProfile(recommendation.profile)
        ? recommendation.profile
        : placeholderProfile(recommendation.user_id, "Friend");

      return {
        ...recommendation,
        profile,
        savedId: item.id,
      };
    })
    .filter(
      (item): item is Recommendation & { profile: Profile; savedId: string } =>
        item !== null
    );
}
