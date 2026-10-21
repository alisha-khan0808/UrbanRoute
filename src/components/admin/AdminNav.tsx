"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Box, FileText, History, Image, Inbox, LayoutDashboard, Map, Menu, Search, Settings, Wrench, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/coverage", label: "Coverage", icon: Map },
  { href: "/admin/scenes", label: "3D scenes", icon: Box },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  return (
    <>
      <div className="flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link href="/admin">
          <Logo inverted />
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" aria-label="Admin menu" className="rounded-lg p-2 text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <aside
        id="admin-nav"
        className={cn(
          "flex-col bg-ink lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0",
          open ? "flex" : "hidden",
        )}
      >
        <div className="hidden px-5 py-6 lg:block">
          <Link href="/admin">
            <Logo inverted />
          </Link>
          <p className="mt-1 pl-[42px] text-xs font-semibold uppercase tracking-widest text-white/40">Admin</p>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition",
                    isActive(item.href) ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", isActive(item.href) && "text-flare")} aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/" className="mt-4 block px-3 text-sm text-white/50 hover:text-white">
            ← View website
          </Link>
        </nav>
        {children}
      </aside>
    </>
  );
}
