import { NextResponse } from "next/server";
import { getStore } from "@/lib/data/store";

export const runtime = "nodejs";

/** Public media assets (media library). Enquiry files are never served here. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = await getStore();
  const file = await store.getMediaFile(params.id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.kind === "url") return NextResponse.redirect(file.url);
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
