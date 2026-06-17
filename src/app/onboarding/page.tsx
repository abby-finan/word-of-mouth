"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BrandBackground } from "@/components/brand/BrandBackground";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RecommendationCategoryForm } from "@/components/recommendations/RecommendationCategoryForm";
import {
  completeOnboarding,
  deleteRecommendation,
  getCurrentProfile,
  getMyRecommendations,
  upsertRecommendation,
  CATEGORIES,
} from "@/lib/actions";
import { Recommendation, RecommendationCategory } from "@/types/database";
import { cn } from "@/lib/utils";

const REQUIRED_RECOMMENDATIONS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [editingCategory, setEditingCategory] = useState<RecommendationCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formHowIKnow, setFormHowIKnow] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [profile, recs] = await Promise.all([
      getCurrentProfile(),
      getMyRecommendations(),
    ]);
    setProfileName(profile?.first_name || "");
    setRecommendations(recs);
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
    setError("");
  }

  function closeEdit() {
    setEditingCategory(null);
  }

  async function handleSaveRecommendation() {
    if (!editingCategory || !formName.trim()) return;
    setFormSaving(true);
    setError("");

    const { error: saveError } = await upsertRecommendation(editingCategory, {
      provider_name: formName.trim(),
      phone: formPhone.trim() || undefined,
      note: formNote.trim() || undefined,
      how_i_know_them: formHowIKnow.trim() || undefined,
    });

    if (saveError) {
      setError(saveError);
      setFormSaving(false);
      return;
    }

    setEditingCategory(null);
    await loadData();
    setFormSaving(false);
  }

  async function handleDelete(category: RecommendationCategory) {
    if (editingCategory === category) {
      closeEdit();
    }
    await deleteRecommendation(category);
    await loadData();
  }

  async function handleFinish() {
    setError("");
    setFinishing(true);

    const { error: finishError } = await completeOnboarding();
    if (finishError) {
      setError(finishError);
      setFinishing(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-cream">
        <BrandBackground variant="auth" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-warm-gray-light">Loading...</div>
        </div>
      </div>
    );
  }

  const recMap = new Map(recommendations.map((r) => [r.category, r]));
  const recCount = recommendations.length;
  const remaining = Math.max(0, REQUIRED_RECOMMENDATIONS - recCount);
  const canFinish = recCount >= REQUIRED_RECOMMENDATIONS;

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <BrandBackground variant="auth" />

      <div className="relative z-10 px-5 py-8 safe-top safe-bottom">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
              Add your trusted people
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              {profileName ? `${profileName}, share` : "Share"} at least{" "}
              {REQUIRED_RECOMMENDATIONS} people you&apos;d recommend to friends.
            </p>
          </div>

          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-charcoal">
                  {recCount} of {REQUIRED_RECOMMENDATIONS} added
                </p>
                <p className="text-xs text-warm-gray mt-0.5">
                  {canFinish
                    ? "You're ready to join Word of Mouth."
                    : remaining === 1
                      ? "Add 1 more to continue."
                      : `Add ${remaining} more to continue.`}
                </p>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: REQUIRED_RECOMMENDATIONS }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      index < recCount ? "bg-sage" : "bg-charcoal/10"
                    )}
                  />
                ))}
              </div>
            </div>
          </Card>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
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
                          Tap + to add
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

          <Button
            className="w-full mt-8"
            disabled={!canFinish}
            loading={finishing}
            onClick={handleFinish}
          >
            {canFinish ? "Continue to Word of Mouth" : `Add ${remaining} more to continue`}
          </Button>
        </div>
      </div>
    </div>
  );
}
