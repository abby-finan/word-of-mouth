/**
 * Extract a human-readable message from Supabase Auth errors.
 * AuthError often has non-enumerable fields, so JSON.stringify(error) => "{}"
 */
export function formatAuthError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  if (typeof error === "string") return error;

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message) {
      return record.message;
    }

    if (typeof record.msg === "string" && record.msg) {
      return record.msg;
    }

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
