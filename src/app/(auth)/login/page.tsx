"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, logAuthError } from "@/lib/auth-errors";
import { AuthCard } from "@/components/brand/AuthCard";
import { BrandBackground } from "@/components/brand/BrandBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <BrandBackground variant="auth" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <AuthCard>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
                Word of Mouth
              </h1>
              <p className="mt-2 text-sm text-warm-gray">
                Find the people your people trust.
              </p>
            </div>

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
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-warm-gray">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-sage hover:underline">
                Sign up
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}
