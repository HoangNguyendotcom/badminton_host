import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create typed Supabase client - always create if possible
// The type assertion ensures TypeScript understands the client is properly typed
const createTypedClient = (): SupabaseClient<Database> | null => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return null;
};

const _supabase = createTypedClient();

// Export a function to get the non-null client (use after isSupabaseConfigured check)
export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    throw new Error("Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return _supabase;
}

// For backwards compatibility
export const supabase = _supabase;
