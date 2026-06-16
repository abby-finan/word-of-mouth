"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, logAuthError } from "@/lib/auth-errors";
import { BrandBackground } from "@/components/brand/BrandBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function prepareRecoverySession() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            logAuthError("reset-password exchangeCodeForSession failed", exchangeError);
            setError("This reset link is invalid or has expired. Request a new one.");
            return;
          }
          window.history.replaceState({}, "", "/reset-password");
        } else if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (verifyError) {
            logAuthError("reset-password verifyOtp failed", verifyError);
            setError("This reset link is invalid or has expired. Request a new one.");
            return;
          }
          window.history.replaceState({}, "", "/reset-password");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSessionReady(true);
        } else {
          setError("This reset link is invalid or has expired. Request a new one.");
        }
      } catch (err) {
        logAuthError("reset-password session prep failed", err);
        setError("Couldn't verify your reset link. Please try again.");
      } finally {
        setCheckingSession(false);
      }
    }

    prepareRecoverySession();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        logAuthError("updateUser password failed", updateError);
        setError(formatAuthError(updateError));
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      logAuthError("reset password threw exception", err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-cream">
        <BrandBackground variant="auth" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="animate-pulse text-warm-gray-light">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <BrandBackground variant="auth" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
              Set new password
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Choose a new password for your account.
            </p>
          </div>

          {!sessionReady ? (
            <div className="space-y-4 text-center">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              <Link href="/login" className="text-sm font-medium text-sage hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Update password
              </Button>
            </form>
          )}

          {sessionReady && (
            <p className="mt-6 text-center text-sm text-warm-gray">
              <Link href="/login" className="font-medium text-sage hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
