import Link from "next/link";
import { Logo } from "./Logo";
import type { SiteSettings } from "@/lib/content/types";
import type { NavService } from "./SiteHeader";

export function SiteFooter({ services, settings }: { services: NavService[]; settings: SiteSettings }) {
  return (
    <footer className="bg-ink text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{settings.tagline}</p>
          <p className="mt-4 text-sm text-white/60">{settings.serviceArea}</p>
        </div>
        <nav aria-label="Services" className="md:col-span-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Services</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-flare">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Contact</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>
              <a href={`mailto:${settings.email}`} className="hover:text-flare">
                {settings.email}
              </a>
            </li>
            <li>
              <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-flare">
                {settings.phone}
              </a>
            </li>
            <li className="pt-2">
              <Link href="/coverage" className="hover:text-flare">
                Coverage
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-flare">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-flare">
                Privacy notice
              </Link>
            </li>
          </ul>
          {settings.placeholderNotice && (
            <p className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60">
              Contact details are placeholders pending confirmation.
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          <p>Prior experience with councils and RCAs does not imply their endorsement.</p>
        </div>
      </div>
    </footer>
  );
}
