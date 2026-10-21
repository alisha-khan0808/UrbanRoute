import Link from "next/link";
import { draftMode } from "next/headers";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getServices, getSettings } from "@/lib/cms";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  const nav = services.map(({ slug, number, title, summary }) => ({ slug, number, title, summary }));
  const preview = draftMode().isEnabled;
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {preview && (
        <div className="relative z-[60] bg-teal px-4 py-2 text-center text-sm font-semibold text-white">
          Draft preview — you are viewing unpublished content.{" "}
          <Link href="/api/admin/preview/exit" prefetch={false} className="underline">
            Exit preview
          </Link>
        </div>
      )}
      <SiteHeader services={nav} />
      <main id="main">{children}</main>
      <SiteFooter services={nav} settings={settings} />
    </>
  );
}
