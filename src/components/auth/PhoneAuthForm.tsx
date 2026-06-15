"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncProfileAfterAuth } from "@/lib/actions";
import { formatAuthError, logAuthError } from "@/lib/auth-errors";
import {
  formatPhoneInputDisplay,
  normalizePhoneToE164,
} from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Step = "phone" | "otp";

interface PhoneAuthFormProps {
  submitLabel: string;
  firstName?: string;
  onFirstNameChange?: (value: string) => void;
  showFirstName?: boolean;
}

export function PhoneAuthForm({
  submitLabel,
  firstName = "",
  onFirstNameChange,
  showFirstName = false,
}: PhoneAuthFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function handlePhoneChange(value: string) {
    setPhone(formatPhoneInputDisplay(value));
  }

  async function sendOtp(targetPhone: string, nameForSignup?: string) {
    const supabase = createClient();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: targetPhone,
      options: {
        data: nameForSignup ? { first_name: nameForSignup.trim() } : undefined,
      },
    });

    if (otpError) {
      logAuthError("signInWithOtp failed", otpError);
      throw new Error(formatAuthError(otpError));
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (showFirstName && !firstName.trim()) {
      setError("Please enter your first name.");
      setLoading(false);
      return;
    }

    const e164 = normalizePhoneToE164(phone);
    if (!e164) {
      setError("Enter a valid phone number (US: 10 digits).");
      setLoading(false);
      return;
    }

    try {
      await sendOtp(e164, showFirstName ? firstName : undefined);
      setNormalizedPhone(e164);
      setStep("otp");
      setResendCooldown(30);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!normalizedPhone) {
      setError("Please request a code first.");
      return;
    }

    const token = otp.trim();
    if (token.length < 6) {
      setError("Enter the 6-digit code from your text message.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: "sms",
      });

      if (verifyError) {
        logAuthError("verifyOtp failed", verifyError);
        setError(formatAuthError(verifyError));
        return;
      }

      if (!data.session) {
        setError("Verification succeeded but no session was created. Try again.");
        return;
      }

      const syncResult = await syncProfileAfterAuth(
        showFirstName ? { first_name: firstName.trim() } : undefined
      );

      if (syncResult.error) {
        setError(syncResult.error);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      logAuthError("verifyOtp threw exception", err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!normalizedPhone || resendCooldown > 0 || loading) return;

    setError("");
    setLoading(true);

    try {
      await sendOtp(
        normalizedPhone,
        showFirstName ? firstName : undefined
      );
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <p className="text-sm text-warm-gray text-center">
          Enter the code sent to{" "}
          <span className="text-charcoal font-medium">{phone || normalizedPhone}</span>
        </p>

        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          required
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
          Verify & continue
        </Button>

        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-sm text-sage font-medium hover:underline disabled:text-warm-gray-light disabled:no-underline"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="text-sm text-warm-gray hover:text-charcoal"
          >
            Change phone number
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      {showFirstName && onFirstNameChange && (
        <Input
          label="First name"
          type="text"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          placeholder="Sarah"
          required
          autoComplete="given-name"
        />
      )}

      <Input
        label="Phone number"
        type="tel"
        value={phone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        placeholder="(555) 123-4567"
        required
        autoComplete="tel"
      />

      <p className="text-xs text-warm-gray-light">
        We&apos;ll text you a one-time verification code. Standard SMS rates may
        apply.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
