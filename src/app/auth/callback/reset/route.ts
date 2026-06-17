import { NextResponse } from "next/server";

/** Legacy reset callback — forward to the unified confirm route. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("next", "/reset-password");

  for (const key of ["code", "token_hash", "type"]) {
    const value = searchParams.get(key);
    if (value) url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url.toString());
}
