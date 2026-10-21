import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">404 · Road closed</p>
      <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">This route doesn&apos;t exist.</h1>
      <p className="mt-3 max-w-md text-ink-soft">The page may have moved. Follow the detour below.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonClass("primary", "md")}>Home</Link>
        <Link href="/services" className={buttonClass("secondary", "md")}>Services</Link>
      </div>
    </section>
  );
}
