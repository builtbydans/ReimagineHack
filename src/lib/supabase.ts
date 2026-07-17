import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";

/**
 * The client is deliberately nullable: importing this module must remain safe
 * when the demo is running without credentials.
 */
const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  : null;

export const getSupabase = (): SupabaseClient | null => supabase;

export default supabase;
