import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";
  const safeNext = next.startsWith("/") ? next : "/reset-password";
  const failUrl = `${origin}/reset-password?error=access_denied&error_code=otp_expired&error_description=${encodeURIComponent("Email link is invalid or has expired")}`;

  // token_hash works cross-browser/device (no PKCE verifier needed).
  if (tokenHash && type) {
    const cookieStore = await cookies();
    const successUrl = `${origin}${safeNext}`;
    const response = NextResponse.redirect(successUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) return response;
    return NextResponse.redirect(failUrl);
  }

  // PKCE code must be exchanged in the browser that requested the reset.
  if (code) {
    const targetUrl = new URL(`${origin}${safeNext}`);
    targetUrl.searchParams.set("code", code);
    return NextResponse.redirect(targetUrl.toString());
  }

  return NextResponse.redirect(failUrl);
}
