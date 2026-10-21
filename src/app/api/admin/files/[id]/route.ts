import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/session";
import { getStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Protected enquiry attachment download. Anonymous requests get 401; files
 * are never exposed through public URLs (local: private folder; Supabase:
 * private bucket + 60-second signed URL created after this check).
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await authorize("enquiry.read");
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const store = await getStore();
  const file = await store.getEnquiryFile(params.id);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await store.audit(user, "enquiry.file_download", "enquiry_file", params.id);
  if (file.kind === "url") return NextResponse.redirect(file.url);
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
