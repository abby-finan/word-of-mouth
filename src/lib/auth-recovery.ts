import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

function cleanRecoveryUrl() {
  window.history.replaceState({}, "", "/reset-password");
}

function hasRecoveryTokensInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    searchParams.get("type") === "recovery" ||
    (hashParams.get("type") === "recovery" && hashParams.has("access_token"))
  );
}

/**
 * Turn a password-reset link (code, token_hash, or hash tokens) into a session
 * so updateUser({ password }) works on the reset page.
 */
export async function establishRecoverySession(
  supabase: SupabaseClient
): Promise<{ ok: boolean; error?: string; hadTokens: boolean }> {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const hadTokens = hasRecoveryTokensInUrl();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) return { ok: false, error: error.message, hadTokens: true };
    cleanRecoveryUrl();
    return { ok: true, hadTokens: true };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, error: error.message, hadTokens: true };
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
  return `${window.location.origin}/reset-password`;
}
