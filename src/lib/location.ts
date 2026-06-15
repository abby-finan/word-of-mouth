import { Profile } from "@/types/database";

type LocationProfile = Pick<Profile, "neighborhood" | "city"> | null | undefined;

export function formatProfileLocation(profile: LocationProfile): string | null {
  if (!profile) return null;

  const neighborhood = profile.neighborhood?.trim();
  const city = profile.city?.trim();

  if (neighborhood && city) return `${neighborhood}, ${city}`;
  if (neighborhood) return neighborhood;
  if (city) return city;

  return null;
}

export function formatProfileLocationOrFallback(
  profile: LocationProfile,
  fallback = "No location set"
): string {
  return formatProfileLocation(profile) ?? fallback;
}
