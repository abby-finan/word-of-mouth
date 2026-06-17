import { RecommendationCategory } from "@/types/database";
import { getCategoryInfo } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface RecommendationCategoryFormProps {
  category: RecommendationCategory;
  providerName: string;
  phone: string;
  note: string;
  howIKnowThem: string;
  onProviderNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onHowIKnowThemChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function RecommendationCategoryForm({
  category,
  providerName,
  phone,
  note,
  howIKnowThem,
  onProviderNameChange,
  onPhoneChange,
  onNoteChange,
  onHowIKnowThemChange,
  onSave,
  onCancel,
  saving = false,
}: RecommendationCategoryFormProps) {
  const categoryInfo = getCategoryInfo(category);

  return (
    <div className="mt-3 space-y-3 border-t border-charcoal/5 pt-3">
      {categoryInfo.description && (
        <p className="text-xs text-warm-gray">{categoryInfo.description}</p>
      )}
      <Input
        label="Provider name"
        value={providerName}
        onChange={(e) => onProviderNameChange(e.target.value)}
        placeholder={
          category === "other"
            ? "e.g. pest control, movers, house cleaner"
            : "Mike's Plumbing"
        }
        required
      />
      <Input
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="(555) 123-4567"
      />
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Used for 3 years. Super reliable."
        rows={2}
      />
      <Textarea
        label="How I know them (optional)"
        value={howIKnowThem}
        onChange={(e) => onHowIKnowThemChange(e.target.value)}
        placeholder="Neighbor recommended them"
        rows={2}
      />
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} loading={saving}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
