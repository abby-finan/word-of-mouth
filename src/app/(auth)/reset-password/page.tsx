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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);

    if (params.get("error") === "expired") {
      setError("That reset link is invalid or has expired. Request a new one below.");
      window.history.replaceState({}, "", "/reset-password");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setCheckingSession(false);
        setError("");
      }
    });

    async function checkSession() {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        if (hashParams.has("access_token") && hashParams.get("type") === "recovery") {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSessionReady(true);
        } else if (!params.get("error")) {
          setError("Open the reset link from your email, or request a new one below.");
        }
      } catch (err) {
        logAuthError("reset-password session check failed", err);
        setError("Couldn't verify your reset link. Request a new one below.");
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  async function handleResendLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setResendLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (resetError) {
        logAuthError("reset-password resend failed", resetError);
        setError(formatAuthError(resetError));
        return;
      }

      setInfo("Check your email for a new reset link.");
    } catch (err) {
      logAuthError("reset-password resend threw", err);
      setError(formatAuthError(err));
    } finally {
      setResendLoading(false);
    }
  }

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
              {sessionReady ? "Set new password" : "Reset your password"}
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              {sessionReady
                ? "Choose a new password for your account."
                : "Request a new link if yours expired."}
            </p>
          </div>

          {sessionReady ? (
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
          ) : (
            <form onSubmit={handleResendLink} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-xl border border-sage/30 bg-sage-light px-4 py-3 text-sm text-charcoal">
                  {info}
                </div>
              )}

              <Button type="submit" className="w-full" loading={resendLoading}>
                Send new reset link
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-warm-gray">
            <Link href="/login" className="font-medium text-sage hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
