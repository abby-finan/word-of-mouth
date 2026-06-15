"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  getCurrentProfile,
  getMyRecommendations,
  upsertRecommendation,
  deleteRecommendation,
  updateProfile,
  signOut,
  CATEGORIES,
} from "@/lib/actions";
import { getCategoryInfo } from "@/lib/constants";
import { Profile, Recommendation, RecommendationCategory } from "@/types/database";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [editingCategory, setEditingCategory] = useState<RecommendationCategory | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formHowIKnow, setFormHowIKnow] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");

  async function loadData() {
    const [p, r] = await Promise.all([
      getCurrentProfile(),
      getMyRecommendations(),
    ]);
    setProfile(p);
    setRecommendations(r);
    if (p) {
      setProfileName(p.first_name);
      setProfileCity(p.city || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openEdit(category: RecommendationCategory) {
    const existing = recommendations.find((r) => r.category === category);
    setEditingCategory(category);
    setFormName(existing?.provider_name || "");
    setFormPhone(existing?.phone || "");
    setFormNote(existing?.note || "");
    setFormHowIKnow(existing?.how_i_know_them || "");
  }

  async function handleSaveRecommendation() {
    if (!editingCategory || !formName.trim()) return;
    setFormSaving(true);

    const { error } = await upsertRecommendation(editingCategory, {
      provider_name: formName.trim(),
      phone: formPhone.trim() || undefined,
      note: formNote.trim() || undefined,
      how_i_know_them: formHowIKnow.trim() || undefined,
    });

    if (!error) {
      setEditingCategory(null);
      await loadData();
    }
    setFormSaving(false);
  }

  async function handleDelete(category: RecommendationCategory) {
    await deleteRecommendation(category);
    await loadData();
  }

  async function handleSaveProfile() {
    await updateProfile({
      first_name: profileName.trim(),
      city: profileCity.trim() || undefined,
    });
    setEditingProfile(false);
    await loadData();
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-light">Loading...</div>
      </div>
    );
  }

  const recMap = new Map(recommendations.map((r) => [r.category, r]));

  return (
    <>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile?.first_name || "?"}
              src={profile?.avatar_url}
              size="xl"
            />
            <div>
              {editingProfile ? (
                <div className="space-y-2">
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="First name"
                  />
                  <Input
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="City (optional)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-charcoal">
                    {profile?.first_name}
                  </h1>
                  {profile?.city && (
                    <p className="text-sm text-warm-gray">{profile.city}</p>
                  )}
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="text-sm text-sage mt-1 hover:underline"
                  >
                    Edit profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-warm-gray mt-6">
          My trusted people — one recommendation per category
        </p>
      </div>

      {editingCategory && (
        <div className="px-5 mb-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-charcoal">
              {getCategoryInfo(editingCategory).label}
            </h3>
            <Input
              label="Provider name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Mike's Plumbing"
              required
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
            <Textarea
              label="Note (optional)"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Used for 3 years. Super reliable."
              rows={2}
            />
            <Textarea
              label="How I know them (optional)"
              value={formHowIKnow}
              onChange={(e) => setFormHowIKnow(e.target.value)}
              placeholder="Neighbor recommended them"
              rows={2}
            />
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSaveRecommendation}
                loading={formSaving}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="px-5 space-y-2">
        {CATEGORIES.map((cat) => {
          const rec = recMap.get(cat.id);
          const Icon = cat.icon;

          return (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-xl p-2", cat.bgColor)}>
                  <Icon size={18} className={cat.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-gray">{cat.label}</p>
                  {rec ? (
                    <p className="font-medium text-charcoal truncate">
                      {rec.provider_name}
                    </p>
                  ) : (
                    <p className="text-sm text-warm-gray-light italic">
                      Not added yet
                    </p>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(cat.id)}
                    className="p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
                    aria-label={rec ? "Edit" : "Add"}
                  >
                    {rec ? <Pencil size={16} /> : <Plus size={16} />}
                  </button>
                  {rec && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 rounded-lg text-warm-gray-light hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {rec?.note && (
                <p className="mt-2 ml-11 text-sm text-warm-gray">{rec.note}</p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="px-5 mt-8 pb-4">
        <Button
          variant="ghost"
          className="w-full text-warm-gray"
          onClick={handleSignOut}
        >
          <LogOut size={16} className="mr-2" />
          Sign out
        </Button>
      </div>
    </>
  );
}
