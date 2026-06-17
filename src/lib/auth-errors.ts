/**
 * Extract a human-readable message from Supabase Auth errors.
 * AuthError often has non-enumerable fields, so JSON.stringify(error) => "{}"
 *
 * Prefer Supabase `code` / `error_code` values over HTTP status or message text.
 * @see https://supabase.com/docs/guides/auth/debugging/error-codes
 */

type AuthErrorRecord = Record<string, unknown>;

const EMAIL_RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_sso_email_rate_limit",
]);

const REQUEST_RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_otp_rate_limit",
]);

function toAuthRecord(error: unknown): AuthErrorRecord | null {
  if (!error || typeof error !== "object") return null;
  return error as AuthErrorRecord;
}

export function getAuthErrorCode(error: unknown): string {
  const record = toAuthRecord(error);
  if (!record) return "";

  const code = record.code ?? record.error_code;
  if (typeof code === "string") return code.toLowerCase();
  if (typeof code === "number") return String(code);

  return "";
}

function getAuthErrorMessage(error: unknown): string {
  const record = toAuthRecord(error);
  if (!record) {
    return typeof error === "string" ? error : "";
  }

  if (typeof record.message === "string" && record.message) {
    return record.message;
  }
  if (typeof record.msg === "string" && record.msg) {
    return record.msg;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "";
}

function isEmailRateLimitError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  if (EMAIL_RATE_LIMIT_CODES.has(code)) return true;

  const message = getAuthErrorMessage(error).toLowerCase();
  return message.includes("email rate limit");
}

function isRequestRateLimitError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  if (REQUEST_RATE_LIMIT_CODES.has(code)) return true;
  if (code === "429") return true;

  const record = toAuthRecord(error);
  const status = record?.status;
  if (status === 429) return true;

  const message = getAuthErrorMessage(error).toLowerCase();
  return (
    message.includes("request rate limit") ||
    message.includes("too many requests")
  );
}

function isSignupCooldownError(error: unknown): boolean {
  const message = getAuthErrorMessage(error).toLowerCase();
  return (
    message.includes("only request this once") ||
    message.includes("once every") ||
    message.includes("security purposes")
  );
}

function isDatabaseSignupError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error).toLowerCase();

  return (
    code === "unexpected_failure" ||
    message.includes("database error saving new user")
  );
}

function isDuplicatePhoneError(error: unknown): boolean {
  const message = getAuthErrorMessage(error).toLowerCase();
  return (
    message.includes("duplicate_phone_number") ||
    message.includes("profiles_phone_number_unique") ||
    message.includes("profiles_phone_match_digits_unique") ||
    (message.includes("duplicate key value") && message.includes("phone_number"))
  );
}

export function formatAuthError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  if (typeof error === "string") return error;

  if (isEmailRateLimitError(error)) {
    return "We can't send another verification email right now because this app hit Supabase's hourly email limit. Wait about an hour and try again, or ask the app owner to enable custom email in Supabase.";
  }

  if (isRequestRateLimitError(error)) {
    return "Too many attempts from this device. Please wait a few minutes and try again.";
  }

  if (isSignupCooldownError(error)) {
    return "Please wait about a minute before trying to sign up again with this email.";
  }

  if (isDatabaseSignupError(error)) {
    return "We couldn't finish creating your account. Please try again in a moment. If it keeps failing, the phone number may already be on another account — try signing in instead.";
  }

  if (isDuplicatePhoneError(error)) {
    return "That phone number is already linked to another account. Try signing in, or use a different number.";
  }

  const message = getAuthErrorMessage(error);
  if (message) {
    const lower = message.toLowerCase();
    if (
      lower.includes("already registered") ||
      lower.includes("already exists") ||
      lower.includes("user already")
    ) {
      return "An account with this email already exists. Please sign in instead.";
    }
    return message;
  }

  const record = toAuthRecord(error);
  if (record) {
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

  const record = toAuthRecord(error);
  if (record) {
    console.error(`[WOM Auth] ${context} details:`, {
      message: record.message,
      msg: record.msg,
      code: record.code,
      error_code: record.error_code,
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
