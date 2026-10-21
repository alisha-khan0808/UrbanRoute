import type { Metadata } from "next";
import { CMSRenderer } from "@/components/cms/CMSRenderer";
import { getPage } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("privacy");
  return { title: page.seo.title, description: page.seo.description, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const page = await getPage("privacy");
  return (
    <div className="py-6">
      <CMSRenderer sections={page.sections} />
    </div>
  );
}
