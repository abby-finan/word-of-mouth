import { NextResponse, type NextRequest } from "next/server";

/** Forwards auth tokens to the target page (usually /reset-password) for client-side session setup. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/reset-password";
  const safeNext = next.startsWith("/") ? next : "/reset-password";

  const targetUrl = new URL(`${origin}${safeNext}`);
  searchParams.forEach((value, key) => {
    if (key !== "next") targetUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(targetUrl.toString());
}
