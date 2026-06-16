import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|sw.js.map|workbox-|swe-worker|manifest.webmanifest|~offline|icons/|splash/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
