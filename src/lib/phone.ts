/** Normalize user input to E.164 for Supabase phone auth (US-focused). */
export function normalizePhoneToE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 10) return `+${digits}`;
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return null;
}

export function formatPhoneInputDisplay(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

export function isEmailQuery(query: string): boolean {
  return query.trim().includes("@");
}

export function isLikelyPhoneQuery(query: string): boolean {
  const digits = query.replace(/\D/g, "");
  return digits.length >= 10 && !isEmailQuery(query);
}
