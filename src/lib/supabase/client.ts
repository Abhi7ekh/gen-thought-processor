import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserSupabaseClient() {
  const { url, key } = getSupabaseConfig();

  return createBrowserClient<Database>(url, key);
}
