"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseConfigStatus } from "@/lib/auth-errors";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";

export default function LoginPage() {
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
            Word of Mouth
          </h1>
          <p className="mt-2 text-warm-gray text-sm">
            Find the people your people trust.
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

        <PhoneAuthForm submitLabel="Send code" />

        <p className="mt-6 text-center text-sm text-warm-gray">
          New here?{" "}
          <Link href="/signup" className="text-sage font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
