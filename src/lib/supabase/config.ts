// Public Supabase settings. Both values are safe to ship in the app:
// the publishable key only works together with Row Level Security,
// which limits every user to their own rows.
// They can be overridden with NEXT_PUBLIC_* environment variables.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jwtdjgruigezzkbxwwjt.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_NhOApgIUWViVqbZTb3qYCg_i1oRNM1R";
