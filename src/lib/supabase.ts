import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  env,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import type { Database } from "@/types/database.types";

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
} as const;

/**
 * The client is deliberately nullable: importing this module must remain safe
 * when the demo is running without credentials.
 */
const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl!, env.supabaseKey!, serverAuthOptions)
  : null;

/**
 * Elevated writes use a separate server-only client. The secret key bypasses
 * RLS and must never be imported into a client component or exposed publicly.
 */
const supabaseAdmin: SupabaseClient<Database> | null = isSupabaseAdminConfigured
  ? createClient<Database>(
      env.supabaseUrl!,
      env.supabaseSecretKey!,
      serverAuthOptions,
    )
  : null;

export const getSupabase = (): SupabaseClient<Database> | null => supabase;
export const getSupabaseAdmin = (): SupabaseClient<Database> | null =>
  supabaseAdmin;

export default supabase;
