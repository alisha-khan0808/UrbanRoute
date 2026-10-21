import "server-only";
import type { EnquiryInput } from "./schema";

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM_EMAIL;
  if (!key || !from) {
    console.info(`[email:dev] to=${to} subject="${subject}" (set RESEND_API_KEY + ENQUIRY_FROM_EMAIL to send)`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
}

/** Notify admins. Failures are logged, never surfaced to the visitor. */
export async function notifyNewEnquiry(reference: string, input: EnquiryInput, serviceTitle: string, fileCount: number) {
  const to = process.env.ENQUIRY_NOTIFY_TO;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    if (to) {
      await sendEmail(
        to,
        `New enquiry ${reference} — ${serviceTitle}`,
        [
          `Reference: ${reference}`,
          `Service: ${serviceTitle}`,
          `Name: ${input.name}${input.company ? ` (${input.company})` : ""}`,
          `Location: ${input.location}`,
          `Attachments: ${fileCount}`,
          "",
          `Review in the admin inbox: ${site}/admin/enquiries`,
        ].join("\n"),
      );
    } else {
      console.info(`[enquiry] ${reference} received (set ENQUIRY_NOTIFY_TO to email admins)`);
    }
    if (process.env.SEND_ACKNOWLEDGEMENT_EMAIL === "true") {
      await sendEmail(
        input.email,
        `We've received your enquiry (${reference})`,
        `Kia ora ${input.name},\n\nThanks for contacting Urban Route NZ about ${serviceTitle}. Your reference is ${reference}. We'll be in touch shortly.\n\nUrban Route NZ`,
      );
    }
  } catch (err) {
    console.error("[enquiry] notification failed", err);
  }
}
