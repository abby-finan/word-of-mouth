/**
 * Extract a human-readable message from Supabase Auth errors.
 * AuthError often has non-enumerable fields, so JSON.stringify(error) => "{}"
 */
function isRateLimitAuthError(message: string, record: Record<string, unknown>): boolean {
  const lower = message.toLowerCase();
  const code = String(record.code ?? record.error_code ?? record.status ?? "");

  return (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate limit") ||
    code === "429" ||
    code === "over_email_send_rate_limit"
  );
}

export function formatAuthError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.msg === "string" && record.msg) ||
      (error instanceof Error ? error.message : "");

    if (message) {
      const lower = message.toLowerCase();
      if (isRateLimitAuthError(message, record)) {
        return "Too many signups. Please wait a few minutes and try again.";
      }
      if (
        lower.includes("already registered") ||
        lower.includes("already exists") ||
        lower.includes("user already")
      ) {
        return "An account with this email already exists. Please sign in instead.";
      }
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    if (isRateLimitAuthError(error.message, error as unknown as Record<string, unknown>)) {
      return "Too many signups. Please wait a few minutes and try again.";
    }
    return error.message;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    const code = record.code ?? record.error_code ?? record.status;
    const parts = [
      typeof record.msg === "string" ? record.msg : null,
      typeof record.message === "string" ? record.message : null,
      code ? `Code: ${code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }

  return "An unknown error occurred. Check the browser console for details.";
}

export function isExistingAccountSignup(data: {
  user: { identities?: { id: string }[] | null } | null;
}): boolean {
  return Boolean(data.user && (!data.user.identities || data.user.identities.length === 0));
}

export function logAuthError(context: string, error: unknown) {
  console.error(`[WOM Auth] ${context}`, error);

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    console.error(`[WOM Auth] ${context} details:`, {
      message: record.message,
      msg: record.msg,
      code: record.code,
      status: record.status,
      name: record.name,
    });
  }
}

export function getSupabaseConfigStatus(): {
  ok: boolean;
  url: string | undefined;
  keyPresent: boolean;
  keyPreview: string | undefined;
  issues: string[];
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const issues: string[] = [];

  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  } else if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL does not look like a valid Supabase URL.");
  }

  if (!key) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  } else if (key.includes("your_supabase")) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY still has placeholder values.");
  }

  return {
    ok: issues.length === 0,
    url,
    keyPresent: Boolean(key),
    keyPreview: key ? `${key.slice(0, 12)}…` : undefined,
    issues,
  };
}
