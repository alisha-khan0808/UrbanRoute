import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  published: "bg-teal-light text-teal-dark",
  changed: "bg-amber-100 text-amber-800",
  draft: "bg-flare-light text-flare-dark",
  default: "bg-ink/5 text-ink-muted",
  new: "bg-flare-light text-flare-dark",
  contacted: "bg-sky-100 text-sky-800",
  quoting: "bg-amber-100 text-amber-800",
  won: "bg-teal-light text-teal-dark",
  lost: "bg-ink/10 text-ink-soft",
  closed: "bg-ink/5 text-ink-muted",
};

const labels: Record<string, string> = {
  published: "Published",
  changed: "Unpublished changes",
  draft: "Draft",
  default: "Built-in content",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize", styles[status] ?? styles.default, className)}>
      {labels[status] ?? status}
    </span>
  );
}
