"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions";
import {
  formatAuthError,
  getSupabaseConfigStatus,
  isExistingAccountSignup,
  logAuthError,
} from "@/lib/auth-errors";
import { normalizePhoneNumber } from "@/lib/phone";
import { BrandBackground } from "@/components/brand/BrandBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [configIssues, setConfigIssues] = useState<string[]>([]);

  useEffect(() => {
    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      setConfigIssues(config.issues);
    }
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (submittingRef.current || loading) return;

    setError("");
    setInfo("");
    submittingRef.current = true;
    setLoading(true);

    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      setError(config.issues.join(" "));
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setError("Phone number is required.");
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizePhoneNumber(trimmedPhone);
    if (!normalizedPhone) {
      setError("Enter a valid US phone number (e.g. (919) 500-9338).");
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            phone_number: normalizedPhone,
          },
        },
      });

      if (signUpError) {
        logAuthError("signUp failed", signUpError);
        setError(formatAuthError(signUpError));
        return;
      }

      if (isExistingAccountSignup(data)) {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
        return;
      }

      if (!data.user) {
        setError("Signup failed — no user was returned.");
        return;
      }

      if (!data.session) {
        setInfo(
          "Account created! Check your email to confirm your address, then sign in."
        );
        return;
      }

      await updateProfile({ phone_number: normalizedPhone });

      router.push("/home");
      router.refresh();
    } catch (err) {
      logAuthError("signUp threw exception", err);
      setError(formatAuthError(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <BrandBackground variant="auth" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-charcoal tracking-tight">
              Join Word of Mouth
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
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
            <Input
              label="Phone number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              required
              autoComplete="tel"
            />
            <p className="-mt-2 text-xs text-warm-gray-light">
              Required — helps friends find you. Not used for login.
            </p>

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

            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-warm-gray">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-sage hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
