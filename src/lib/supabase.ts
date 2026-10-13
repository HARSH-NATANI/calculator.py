import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key && !url.includes("your-project"));
export const supabase = configured
  ? createClient(new URL(url, window.location.origin).href, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export function db() {
  if (!supabase)
    throw new Error(
      "Cloud storage is not connected yet. Add the Supabase project URL and public key to the environment configuration.",
    );
  return supabase;
}
