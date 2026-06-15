"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseConfigStatus } from "@/lib/auth-errors";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [configIssues, setConfigIssues] = useState<string[]>([]);

  useEffect(() => {
    const config = getSupabaseConfigStatus();
    if (!config.ok) {
      setConfigIssues(config.issues);
    }
  }, []);

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

        <PhoneAuthForm
          submitLabel="Send code"
          showFirstName
          firstName={firstName}
          onFirstNameChange={setFirstName}
        />

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
