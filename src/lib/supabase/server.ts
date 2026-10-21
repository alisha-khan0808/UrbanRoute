import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Client bound to the signed-in user's session: RLS policies apply. */
export function createUserClient(): SupabaseClient {
  const cookieStore = cookies();
  return createServerClient(url(), anonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client: can only read the `published_content` view. */
export function createAnonClient(): SupabaseClient {
  return createClient(url(), anonKey(), { auth: { persistSession: false } });
}

/**
 * Service-role client. SERVER ONLY — bypasses RLS. Used solely for inserting
 * validated public enquiries and for creating signed download URLs after an
 * explicit admin role check.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}
