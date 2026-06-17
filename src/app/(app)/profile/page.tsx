"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RecommendationCategoryForm } from "@/components/recommendations/RecommendationCategoryForm";
import {
  getCurrentProfile,
  getMyRecommendations,
  upsertRecommendation,
  deleteRecommendation,
  updateProfile,
  uploadProfileAvatar,
  signOut,
  CATEGORIES,
} from "@/lib/actions";
import { formatProfileLocation } from "@/lib/location";
import { normalizePhoneNumber } from "@/lib/phone";
import { Profile, Recommendation, RecommendationCategory } from "@/types/database";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [editingCategory, setEditingCategory] = useState<RecommendationCategory | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profileError, setProfileError] = useState("");

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formHowIKnow, setFormHowIKnow] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileNeighborhood, setProfileNeighborhood] = useState("");
  const [profilePhoneNumber, setProfilePhoneNumber] = useState("");

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
      setProfileNeighborhood(p.neighborhood || "");
      setProfilePhoneNumber(p.phone_number || "");
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

  function closeEdit() {
    setEditingCategory(null);
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
    if (editingCategory === category) {
      closeEdit();
    }
    await deleteRecommendation(category);
    await loadData();
  }

  async function handleSaveProfile() {
    setProfileError("");

    const trimmedPhone = profilePhoneNumber.trim();
    let phoneToSave: string | undefined;

    if (trimmedPhone) {
      const normalized = normalizePhoneNumber(trimmedPhone);
      if (!normalized) {
        setProfileError("Enter a valid phone number or leave it blank.");
        return;
      }
      phoneToSave = normalized;
    } else {
      phoneToSave = "";
    }

    const { error } = await updateProfile({
      first_name: profileName.trim(),
      city: profileCity.trim(),
      neighborhood: profileNeighborhood.trim(),
      phone_number: phoneToSave,
    });

    if (error) {
      setProfileError(error);
      return;
    }

    setEditingProfile(false);
    await loadData();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setAvatarError("");
    setUploadingAvatar(true);

    const { url, error } = await uploadProfileAvatar(file);

    if (error) {
      setAvatarError(error);
    } else if (url) {
      setProfile((current) =>
        current ? { ...current, avatar_url: url } : current
      );
      await loadData();
    }

    setUploadingAvatar(false);
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
  const locationLabel = formatProfileLocation(profile);

  return (
    <>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={profile?.first_name || "?"}
                src={profile?.avatar_url}
                size="xl"
                className={uploadingAvatar ? "opacity-50" : undefined}
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage border-t-transparent" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 rounded-full bg-charcoal text-white p-2 shadow-sm disabled:opacity-50"
                aria-label="Upload profile photo"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              {editingProfile ? (
                <div className="space-y-2">
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="First name"
                  />
                  <Input
                    value={profileNeighborhood}
                    onChange={(e) => setProfileNeighborhood(e.target.value)}
                    placeholder="Neighborhood (optional)"
                  />
                  <Input
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="City (optional)"
                  />
                  <Input
                    label="Phone number (optional)"
                    type="tel"
                    value={profilePhoneNumber}
                    onChange={(e) => setProfilePhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                  {profileError && (
                    <p className="text-sm text-red-500">{profileError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileError("");
                        setProfileName(profile?.first_name || "");
                        setProfileCity(profile?.city || "");
                        setProfileNeighborhood(profile?.neighborhood || "");
                        setProfilePhoneNumber(profile?.phone_number || "");
                      }}
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
                  {locationLabel && (
                    <p className="text-sm text-warm-gray">{locationLabel}</p>
                  )}
                  {profile?.phone_number && (
                    <p className="text-sm text-warm-gray">{profile.phone_number}</p>
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

        {avatarError && (
          <p className="mt-3 text-sm text-red-500">{avatarError}</p>
        )}

        <p className="text-sm text-warm-gray mt-6">
          My trusted people — one recommendation per category
        </p>
      </div>

      <div className="px-5 space-y-2">
        {CATEGORIES.map((cat) => {
          const rec = recMap.get(cat.id);
          const Icon = cat.icon;
          const isEditing = editingCategory === cat.id;

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
                    onClick={() => (isEditing ? closeEdit() : openEdit(cat.id))}
                    className="p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
                    aria-label={rec ? "Edit" : "Add"}
                  >
                    {isEditing ? (
                      <Pencil size={16} className="text-sage" />
                    ) : rec ? (
                      <Pencil size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                  {rec && !isEditing && (
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

              {rec?.note && !isEditing && (
                <p className="mt-2 ml-11 text-sm text-warm-gray truncate">
                  {rec.note}
                </p>
              )}

              {isEditing && (
                <RecommendationCategoryForm
                  category={cat.id}
                  providerName={formName}
                  phone={formPhone}
                  note={formNote}
                  howIKnowThem={formHowIKnow}
                  onProviderNameChange={setFormName}
                  onPhoneChange={setFormPhone}
                  onNoteChange={setFormNote}
                  onHowIKnowThemChange={setFormHowIKnow}
                  onSave={handleSaveRecommendation}
                  onCancel={closeEdit}
                  saving={formSaving}
                />
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
