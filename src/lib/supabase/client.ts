import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";
import { createBrowserClient } from "@supabase/ssr";

// Supabase client for code that runs in the browser.
export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );
}
