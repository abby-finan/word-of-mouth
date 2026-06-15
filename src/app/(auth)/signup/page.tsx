"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  formatAuthError,
  getSupabaseConfigStatus,
  logAuthError,
} from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [configIssues, setConfigIssues] = useState<string[]>([]);

  useEffect(() => {
    const config = getSupabaseConfigStatus();
    console.log("[WOM Signup] Supabase config:", {
      ok: config.ok,
      url: config.url,
      keyPresent: config.keyPresent,
      keyPreview: config.keyPreview,
    });

    if (!config.ok) {
      setConfigIssues(config.issues);
      console.error("[WOM Signup] Config issues:", config.issues);
    }
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      const message = config.issues.join(" ");
      setError(message);
      console.error("[WOM Signup] Blocked — invalid config:", config.issues);
      setLoading(false);
      return;
    }

    console.log("[WOM Signup] Starting signUp for:", email);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: firstName.trim() },
        },
      });

      console.log("[WOM Signup] signUp response:", {
        userId: data.user?.id,
        session: Boolean(data.session),
        emailConfirmed: data.user?.email_confirmed_at,
        error: signUpError,
      });

      if (signUpError) {
        logAuthError("signUp failed", signUpError);
        setError(formatAuthError(signUpError));
        setLoading(false);
        return;
      }

      if (!data.user) {
        console.error("[WOM Signup] No user returned and no error.");
        setError("Signup failed — no user was returned. Check Supabase Auth settings.");
        setLoading(false);
        return;
      }

      // Email confirmation enabled: user created but no session yet
      if (!data.session) {
        console.log("[WOM Signup] User created; email confirmation required.");
        setInfo(
          "Account created! Check your email to confirm your address, then sign in."
        );
        setLoading(false);
        return;
      }

      console.log("[WOM Signup] Success — redirecting to /home");
      router.push("/home");
      router.refresh();
    } catch (err) {
      logAuthError("signUp threw exception", err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
            Join Word of Mouth
          </h1>
          <p className="mt-2 text-warm-gray text-sm">
            Share your trusted people. Discover theirs.
          </p>
        </div>

        {configIssues.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">Configuration problem</p>
            <ul className="mt-1 list-disc pl-4">
              {configIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="First name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Sarah"
            required
            autoComplete="given-name"
          />
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
            placeholder="At least 6 characters"
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

          {info && (
            <div className="rounded-xl border border-sage/30 bg-sage-light px-4 py-3 text-sm text-charcoal">
              {info}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-warm-gray">
          Already have an account?{" "}
          <Link href="/login" className="text-sage font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
