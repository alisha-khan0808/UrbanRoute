import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/session";
import { getStore } from "@/lib/data/store";
import { toCsv } from "@/lib/csv";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/enquiry/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await authorize("enquiry.export");
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "";
  const store = await getStore();
  const enquiries = await store.listEnquiries({
    status: ENQUIRY_STATUSES.includes(status as EnquiryStatus) ? (status as EnquiryStatus) : "",
    service: params.get("service") ?? "",
    q: (params.get("q") ?? "").slice(0, 100),
  });
  await store.audit(user, "enquiry.export", "enquiry", String(enquiries.length));
  const csv = toCsv(
    ["reference", "created_at", "status", "service", "name", "company", "email", "phone", "location", "start_date", "description", "details", "files"],
    enquiries.map((e) => [
      e.reference,
      e.createdAt,
      e.status,
      e.service,
      e.name,
      e.company,
      e.email,
      e.phone,
      e.location,
      e.startDate,
      e.description,
      JSON.stringify(e.details),
      String(e.files.length),
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
