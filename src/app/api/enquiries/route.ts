import { NextResponse } from "next/server";
import { getServices } from "@/lib/cms";
import { getStore } from "@/lib/data/store";
import { notifyNewEnquiry } from "@/lib/enquiry/notify";
import { processEnquiry } from "@/lib/enquiry/process";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const { ok, retryAfter } = limiter.check(clientIp(request.headers));
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Too many enquiries from this connection. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid submission" }, { status: 400 });
  }

  const services = await getServices();
  const result = await processEnquiry(form, services.map((s) => s.slug));
  if (result.kind === "spam") {
    // Pretend success so bots get no signal.
    return NextResponse.json({ ok: true, reference: "UR-RECEIVED" });
  }
  if (result.kind === "invalid") {
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields", fieldErrors: result.fieldErrors }, { status: 422 });
  }

  try {
    const store = await getStore();
    const { reference } = await store.createEnquiry(result.input, result.files);
    await store.audit(null, "enquiry.create", "enquiry", reference);
    const title = services.find((s) => s.slug === result.input.service)?.title ?? "General enquiry";
    void notifyNewEnquiry(reference, result.input, title, result.files.length);
    return NextResponse.json({ ok: true, reference });
  } catch (err) {
    console.error("[enquiry] store failed", err);
    return NextResponse.json({ ok: false, error: "We couldn't save your enquiry. Please try again or email us." }, { status: 500 });
  }
}
