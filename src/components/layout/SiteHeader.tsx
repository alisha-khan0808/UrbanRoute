"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavService {
  slug: string;
  number: string;
  title: string;
  summary: string;
}

const links = [
  { href: "/coverage", label: "Coverage" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ services }: { services: NavService[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setServicesOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
    <header
      className={cn(
        "z-40 w-full",
        isHome ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-line/80 bg-paper/85 backdrop-blur-md",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link href="/" className="rounded-lg" aria-label="Urban Route NZ — home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="relative" onMouseLeave={() => setServicesOpen(false)}>
            <button
              type="button"
              aria-expanded={servicesOpen}
              aria-controls="services-menu"
              onClick={() => setServicesOpen((v) => !v)}
              onMouseEnter={() => setServicesOpen(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-semibold transition hover:bg-ink/5",
                active("/services") && "text-flare-dark",
              )}
            >
              Services <ChevronDown className={cn("h-4 w-4 transition", servicesOpen && "rotate-180")} aria-hidden />
            </button>
            {servicesOpen && (
              <div id="services-menu" className="absolute left-1/2 top-full w-[640px] -translate-x-1/2 pt-2">
                <div className="card grid grid-cols-2 gap-1 p-3 animate-fade-up">
                  {services.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="group rounded-xl p-3 transition hover:bg-paper"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-flare">{s.number}</span>
                        <span className="font-bold group-hover:text-flare-dark">{s.title}</span>
                      </span>
                      <span className="mt-1 line-clamp-2 block pl-7 text-sm text-ink-muted">{s.summary}</span>
                    </Link>
                  ))}
                  <Link
                    href="/services"
                    className="col-span-2 mt-1 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white"
                  >
                    View all services <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            )}
          </div>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[15px] font-semibold transition hover:bg-ink/5",
                active(l.href) && "text-flare-dark",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/contact" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
            Start an enquiry
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>

      {/* Outside <header>: its backdrop-filter would trap a fixed-position child. */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-[45] overflow-y-auto bg-paper lg:hidden">
          <nav aria-label="Mobile" className="container-x flex flex-col gap-1 py-6">
            <p className="eyebrow mb-2">Services</p>
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[17px] font-semibold active:bg-ink/5"
              >
                <span className="w-6 text-sm font-bold text-flare">{s.number}</span>
                {s.title}
              </Link>
            ))}
            <Link href="/services" className="px-3 py-2 text-sm font-semibold text-teal-dark">
              All services →
            </Link>
            <div className="my-4 h-px bg-line" />
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 text-xl font-bold active:bg-ink/5">
                {l.label}
              </Link>
            ))}
            <Link href="/contact" className={buttonClass("primary", "lg", "mt-6 w-full")}>
              Start an enquiry
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
