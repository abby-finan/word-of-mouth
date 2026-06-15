"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getFriends,
  getPendingRequests,
  searchUserByEmail,
  sendFriendRequest,
  respondToFriendRequest,
} from "@/lib/friends";
import { Profile, Friendship } from "@/types/database";

function displayName(profile?: Profile | null, fallback = "Unknown user") {
  return profile?.first_name?.trim() || fallback;
}

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<
    (Friendship & { friend: Profile; recommendationCount: number })[]
  >([]);
  const [pending, setPending] = useState<
    (Friendship & { requester: Profile })[]
  >([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function loadData() {
    setLoadError("");

    try {
      const [f, p] = await Promise.all([getFriends(), getPendingRequests()]);
      setFriends(f);
      setPending(p);
    } catch (error) {
      console.error("[WOM Friends] loadData error:", error);
      setLoadError("Couldn't load friends right now. Pull to refresh or try again.");
      setFriends([]);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAdding(true);

    try {
      const user = await searchUserByEmail(email.trim());
      if (!user) {
        setAddError("No user found with that email.");
        setAdding(false);
        return;
      }

      const { error } = await sendFriendRequest(user.id);
      if (error) {
        setAddError(
          error.includes("duplicate") ? "Friend request already sent." : error
        );
      } else {
        setAddSuccess(`Friend request sent to ${displayName(user, "your friend")}!`);
        setEmail("");
      }
    } catch (error) {
      console.error("[WOM Friends] handleAddFriend error:", error);
      setAddError("Couldn't send friend request. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRespond(id: string, accept: boolean) {
    try {
      await respondToFriendRequest(id, accept);
      await loadData();
    } catch (error) {
      console.error("[WOM Friends] handleRespond error:", error);
      setLoadError("Couldn't update that friend request. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-light">Loading friends...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-charcoal tracking-tight">
          Friends
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <UserPlus size={16} className="mr-1.5" />
          Add
        </Button>
      </div>

      {loadError && (
        <div className="px-5 mb-4">
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {loadError}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="px-5 mb-4">
          <Card className="p-4">
            <form onSubmit={handleAddFriend} className="space-y-3">
              <Input
                label="Friend's email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
              {addError && (
                <p className="text-sm text-red-500">{addError}</p>
              )}
              {addSuccess && (
                <p className="text-sm text-sage">{addSuccess}</p>
              )}
              <Button type="submit" size="sm" loading={adding}>
                Send request
              </Button>
            </form>
          </Card>
        </div>
      )}

      {pending.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-sm font-medium text-warm-gray mb-2">
            Friend requests
          </h2>
          <div className="space-y-2">
            {pending.map((req) => {
              const requesterName = displayName(req.requester, "Someone");
              const isUnknown = requesterName === "Someone" || requesterName === "Unknown user";

              return (
                <Card key={req.id} className="p-4 flex items-center gap-3">
                  <Avatar
                    name={requesterName}
                    src={req.requester?.avatar_url}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal truncate">
                      {requesterName}
                    </p>
                    {req.requester?.city ? (
                      <p className="text-sm text-warm-gray">{req.requester.city}</p>
                    ) : isUnknown ? (
                      <p className="text-sm text-warm-gray-light italic">
                        Profile unavailable
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(req.id, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRespond(req.id, false)}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-5">
        {friends.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-warm-gray text-sm leading-relaxed">
              {pending.length > 0
                ? "Accept a friend request to start seeing their trusted people."
                : "Add friends to see their trusted service providers. Share your recommendations to unlock theirs."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(({ id, friend, recommendationCount }) => {
              const friendName = displayName(friend, "Friend");

              return (
                <Card
                  key={id}
                  className="p-4 flex items-center gap-3"
                  onClick={() => {
                    if (friend?.id) {
                      router.push(`/friends/${friend.id}`);
                    }
                  }}
                >
                  <Avatar
                    name={friendName}
                    src={friend?.avatar_url}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal">{friendName}</p>
                    <p className="text-sm text-warm-gray">
                      {friend?.city || "No location set"}
                      {recommendationCount > 0 &&
                        ` · ${recommendationCount} recommendation${recommendationCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-warm-gray-light" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
