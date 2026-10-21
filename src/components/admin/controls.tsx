"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/app/admin/actions";
import { ENQUIRY_STATUSES } from "@/lib/enquiry/schema";
import { cn } from "@/lib/utils";

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <span role={result.ok ? "status" : "alert"} className={cn("text-sm font-semibold", result.ok ? "text-teal-dark" : "text-flare-dark")}>
      {result.ok ? result.message : result.error}
    </span>
  );
}

const forbidden = (e: unknown): ActionResult => ({
  ok: false,
  error: e instanceof Error && e.message.startsWith("Forbidden") ? "Your role does not allow this action" : "Something went wrong",
});

/** Button that runs a bound server action, with optional confirmation. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "sm",
  disabled,
}: {
  action: () => Promise<ActionResult | void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <span className="inline-flex items-center gap-3">
      <Button
        variant={variant}
        size={size}
        disabled={pending || disabled}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            try {
              const r = await action();
              if (r) setResult(r);
            } catch (e) {
              if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
              setResult(forbidden(e));
            }
          });
        }}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Button>
      <Feedback result={result} />
    </span>
  );
}

export function EnquiryStatusSelect({
  value,
  action,
  disabled,
}: {
  value: string;
  action: (status: string) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState(value);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="enquiry-status" className="sr-only">
        Status
      </label>
      <select
        id="enquiry-status"
        className="field w-auto capitalize"
        value={status}
        disabled={pending || disabled}
        onChange={(e) => {
          const next = e.target.value;
          setStatus(next);
          start(async () => {
            try {
              setResult(await action(next));
            } catch (err) {
              setResult(forbidden(err));
            }
          });
        }}
      >
        {ENQUIRY_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Feedback result={result} />
    </div>
  );
}

function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

/** Small form wired to a server action via useFormState. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  resetOnSuccess = false,
  variant,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction] = useFormState(async (prev: ActionResult | null, form: FormData) => {
    try {
      return await action(prev, form);
    } catch (e) {
      return forbidden(e);
    }
  }, null);
  return (
    <form
      action={async (form) => {
        await formAction(form);
      }}
      onSubmit={(e) => {
        if (resetOnSuccess) {
          const f = e.currentTarget;
          setTimeout(() => f.reset(), 0);
        }
      }}
      className={className}
    >
      {children}
      <div className="mt-3 flex items-center gap-3">
        <SubmitButton variant={variant}>{submitLabel}</SubmitButton>
        <Feedback result={state} />
      </div>
    </form>
  );
}
