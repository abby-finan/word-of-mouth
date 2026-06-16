"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, logAuthError } from "@/lib/auth-errors";
import { BrandBackground } from "@/components/brand/BrandBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "reset") {
      setError("That password reset link is invalid or has expired. Request a new one below.");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        logAuthError("signIn failed", signInError);
        setError(formatAuthError(signInError));
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      logAuthError("signIn threw exception", err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setResetLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback/reset`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (resetError) {
        logAuthError("resetPasswordForEmail failed", resetError);
        setError(formatAuthError(resetError));
        return;
      }

      setInfo("Check your email for a link to reset your password.");
    } catch (err) {
      logAuthError("resetPasswordForEmail threw exception", err);
      setError(formatAuthError(err));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <BrandBackground variant="auth" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
              Word of Mouth
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Find the people your people trust.
            </p>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-warm-gray">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
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

              <Button type="submit" className="w-full" loading={resetLoading}>
                Send reset link
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError("");
                  setInfo("");
                }}
                className="w-full text-center text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                    setInfo("");
                  }}
                  className="mt-2 text-sm text-sage hover:underline"
                >
                  Forgot password?
                </button>
              </div>

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

              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>
          )}

          {!showForgotPassword && (
            <p className="mt-6 text-center text-sm text-warm-gray">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-sage hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
