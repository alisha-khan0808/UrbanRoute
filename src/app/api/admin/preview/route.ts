import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Enable draft mode for signed-in staff, then open the requested page. */
export async function GET(request: Request) {
  const user = await authorize("content.read");
  if (!user) return NextResponse.redirect(new URL("/admin/login", request.url));
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "/";
  // Only allow same-site relative paths (no open redirects).
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  draftMode().enable();
  return NextResponse.redirect(new URL(safe, request.url));
}
