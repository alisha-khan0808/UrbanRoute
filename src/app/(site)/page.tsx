import type { Metadata } from "next";
import Link from "next/link";
import { HomeExperience, type HomeHotspot } from "@/components/home/HomeExperience";
import { CMSRenderer } from "@/components/cms/CMSRenderer";
import { ServiceCard } from "@/components/services/ServiceCard";
import { isSceneKey } from "@/components/three/layout";
import { getPage, getSceneConfig, getServices } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("home");
  return {
    title: page.seo.title || "Urban Route NZ",
    description: page.seo.description,
    alternates: { canonical: "/" },
    openGraph: { title: page.seo.title, description: page.seo.description, images: page.seo.ogImage ? [page.seo.ogImage] : undefined },
  };
}

export default async function HomePage() {
  const [page, services, scene] = await Promise.all([getPage("home"), getServices(), getSceneConfig()]);
  const hero = page.sections.find((s) => s.type === "hero");

  const hotspots: HomeHotspot[] = scene.hotspots
    .filter((h) => h.enabled && isSceneKey(h.id))
    .flatMap((h) => {
      const service = services.find((s) => s.slug === h.destination);
      if (!service || !isSceneKey(h.id)) return [];
      return [{ sceneKey: h.id, slug: service.slug, number: service.number, label: h.label, cameraPreset: h.cameraPreset }];
    });

  const overlayServices = services.map((s) => ({
    slug: s.slug,
    number: s.number,
    title: s.title,
    summary: s.summary,
    steps: s.steps.map((st) => st.title),
    ctaLabel: s.ctaLabel,
    sceneKey: s.sceneKey,
    specialisms: s.specialisms.map((x) => x.title),
  }));

  return (
    <>
      <HomeExperience
        hero={{
          eyebrow: hero?.eyebrow ?? "",
          heading: hero?.heading ?? "Urban Route NZ",
          body: hero?.body ?? "",
          ctaLabel: hero?.ctaLabel ?? "Start an enquiry",
          ctaHref: hero?.ctaHref ?? "/contact",
        }}
        hotspots={hotspots}
        services={overlayServices}
        sceneEnabled={scene.enabled}
        introAnimation={scene.introAnimation}
        defaultQuality={scene.defaultQuality}
        modelUrl={scene.modelUrl}
      />

      <CMSRenderer sections={page.sections.filter((s) => s.type === "stats")} />

      {/* Indexable service directory — the same content as the 3D hotspots */}
      <section className="container-x py-14 md:py-20" aria-labelledby="services-heading">
        <p className="eyebrow">Services</p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <h2 id="services-heading" className="max-w-2xl text-3xl font-extrabold md:text-4xl">
            Seven services, one coordinated team
          </h2>
          <Link href="/services" className="font-bold text-flare-dark hover:underline">
            Compare all services →
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug} className="min-w-0">
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
      </section>

      <CMSRenderer sections={page.sections.filter((s) => s.type !== "hero" && s.type !== "stats")} />
    </>
  );
}
