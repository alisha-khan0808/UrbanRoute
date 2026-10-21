import type { Metadata } from "next";
import { CMSRenderer } from "@/components/cms/CMSRenderer";
import { getPage } from "@/lib/cms";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return { title: page.seo.title, description: page.seo.description, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const page = await getPage("about");
  return <CMSRenderer sections={page.sections} />;
}
