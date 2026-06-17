import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

function getParam(searchParams: URLSearchParams, hashParams: URLSearchParams, key: string) {
  return searchParams.get(key) || hashParams.get(key);
}

export interface RecoveryLinkError {
  error?: string;
  code?: string;
  description?: string;
}

/** Supabase appends these when the email link is invalid, expired, or already used. */
export function getRecoveryLinkErrorFromUrl(): RecoveryLinkError | null {
  if (typeof window === "undefined") return null;

  const searchParams = getSearchParams();
  const hashParams = getHashParams();

  const error = getParam(searchParams, hashParams, "error");
  const code = getParam(searchParams, hashParams, "error_code");
  const description = getParam(searchParams, hashParams, "error_description");

  if (error || code || description) {
    return {
      error: error ?? undefined,
      code: code ?? undefined,
      description: description ? decodeURIComponent(description.replace(/\+/g, " ")) : undefined,
    };
  }

  if (searchParams.get("error") === "expired") {
    return { code: "expired" };
  }

  return null;
}

export function formatRecoveryLinkError(linkError: RecoveryLinkError): string {
  const code = linkError.code?.toLowerCase() ?? "";
  const description = linkError.description?.toLowerCase() ?? "";

  if (
    code === "otp_expired" ||
    code === "expired" ||
    description.includes("expired") ||
    description.includes("invalid")
  ) {
    return "That reset link has expired or was already used. Password reset links work once — request a new link below and open the newest email only.";
  }

  if (code === "access_denied") {
    return "That reset link is no longer valid. Request a new one below and use the link from your most recent email.";
  }

  if (linkError.description) {
    return linkError.description;
  }

  return "That reset link is invalid or has expired. Request a new one below.";
}

export function cleanRecoveryUrl() {
  window.history.replaceState({}, "", "/reset-password");
}

function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function getHashParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function hasRecoveryTokensInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const searchParams = getSearchParams();
  const hashParams = getHashParams();

  return (
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    searchParams.get("type") === "recovery" ||
    (hashParams.get("type") === "recovery" && hashParams.has("access_token"))
  );
}

/** Send token_hash links through the server confirm route for reliable cookie setup. */
export function redirectTokenHashToConfirmRoute(): boolean {
  const searchParams = getSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type) return false;

  const url = new URL("/auth/confirm", window.location.origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("next", "/reset-password");
  window.location.replace(url.toString());
  return true;
}

/**
 * Turn a password-reset link (code or hash tokens) into a session.
 * token_hash links are handled by /auth/confirm on the server.
 */
export async function establishRecoverySession(
  supabase: SupabaseClient
): Promise<{ ok: boolean; error?: string; hadTokens: boolean; linkError?: RecoveryLinkError }> {
  const linkError = getRecoveryLinkErrorFromUrl();
  if (linkError) {
    cleanRecoveryUrl();
    return { ok: false, hadTokens: false, linkError };
  }

  if (redirectTokenHashToConfirmRoute()) {
    return { ok: false, hadTokens: true };
  }

  const searchParams = getSearchParams();
  const hashParams = getHashParams();
  const code = searchParams.get("code");
  const hadTokens = hasRecoveryTokensInUrl();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return {
        ok: false,
        error: error.message,
        hadTokens: true,
      };
    }
    cleanRecoveryUrl();
    return { ok: true, hadTokens: true };
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (hashParams.get("type") === "recovery" && accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { ok: false, error: error.message, hadTokens: true };
    cleanRecoveryUrl();
    return { ok: true, hadTokens: true };
  }

  if (hashParams.get("type") === "recovery" && accessToken) {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { ok: true, hadTokens };
  }

  return { ok: false, hadTokens };
}

export function getPasswordResetRedirectUrl(): string {
  return `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;
}

export function getPkceRecoveryErrorMessage(errorMessage: string): string {
  const lower = errorMessage.toLowerCase();
  if (
    lower.includes("code verifier") ||
    lower.includes("both auth code and code verifier") ||
    lower.includes("pkce")
  ) {
    return "Open the reset link in the same browser where you requested it (copy the link into Safari instead of the Mail app), or request a new link below.";
  }
  return "That reset link is invalid or has expired. Request a new one below.";
}
