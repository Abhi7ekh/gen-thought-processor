import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createServerSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The server component is not allowed to write cookies in some contexts.
          // This is expected for reads and should not block the request.
        }
      },
    },
  });
}

export async function createServerSupabaseSession() {
  return createServerSupabaseClient();
}
