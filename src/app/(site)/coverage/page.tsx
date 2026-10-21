import type { Metadata } from "next";
import { CoverageExplorer } from "@/components/coverage/CoverageExplorer";
import { CMSRenderer } from "@/components/cms/CMSRenderer";
import { getPage, getRegions } from "@/lib/cms";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("coverage");
  return { title: page.seo.title, description: page.seo.description, alternates: { canonical: "/coverage" } };
}

export default async function CoveragePage() {
  const [page, regions] = await Promise.all([getPage("coverage"), getRegions()]);
  return (
    <>
      <CMSRenderer sections={page.sections} />
      <section className="container-x py-10 md:py-14" aria-label="Coverage map">
        <CoverageExplorer regions={regions} />
        <div className="mt-10 rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          <p>
            <strong className="text-ink">Nationwide availability:</strong> we provide services anywhere in New Zealand.
            Highlighted areas show where we have documented prior experience. Markers are representative locations, not
            project coordinates, and do not imply endorsement by any council, road controlling authority or NZTA Waka Kotahi.
          </p>
        </div>
      </section>
    </>
  );
}
