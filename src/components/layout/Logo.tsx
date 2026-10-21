import { cn } from "@/lib/utils";

/** Placeholder wordmark — replace with the approved Urban Route NZ logo. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={inverted ? "#F7F8F6" : "#17232B"} />
        <path d="M8 23 L14 9 L18 9 L24 23" fill="none" stroke="#FF6542" strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 12 v3 M16 18 v3" stroke={inverted ? "#17232B" : "#F7F8F6"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="23" r="2.4" fill="#21B7AA" />
      </svg>
      <span className={cn("text-[17px] font-extrabold leading-none tracking-tight", inverted ? "text-white" : "text-ink")}>
        Urban Route <span className="text-flare">NZ</span>
      </span>
    </span>
  );
}
