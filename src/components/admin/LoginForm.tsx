"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-2 w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(loginAction, null);
  return (
    <form action={action} className="mt-5 grid gap-4">
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-flare-light px-3 py-2 text-sm font-semibold text-flare-dark">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <Submit />
    </form>
  );
}
