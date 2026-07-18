import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

const loggedWarnings = new Set<string>();
let fallbackVersion = 0;

const warnOnce = (scope: string, reason: string) => {
  const key = `${scope}:${reason}`;
  if (loggedWarnings.has(key)) return;

  loggedWarnings.add(key);
  console.warn(`[Thread data] ${scope}: ${reason}`);
};

export const getRepositoryFallbackVersion = () => fallbackVersion;

export class RepositoryError extends Error {
  constructor(
    public readonly scope: string,
    message: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export const requireSuccessfulQuery = (
  scope: string,
  error: { message: string } | null,
) => {
  if (error) throw new RepositoryError(scope, error.message);
};

/**
 * Uses seeded data when credentials are absent. A remote failure falls back in
 * development so the demo remains usable, while production surfaces the error
 * rather than quietly replacing a real patient's data with a synthetic record.
 */
export async function withRepositoryFallback<T>(input: {
  scope: string;
  remote: (client: SupabaseClient) => Promise<T>;
  fallback: () => Promise<T> | T;
}): Promise<T> {
  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) {
    fallbackVersion += 1;
    warnOnce(input.scope, "Supabase is not configured; using seeded fallback.");
    return input.fallback();
  }

  try {
    return await input.remote(supabase);
  } catch (error) {
    fallbackVersion += 1;
    const message = error instanceof Error ? error.message : "unknown remote error";
    warnOnce(
      input.scope,
      `Supabase unavailable (${message}); using seeded fallback.`,
    );
    return input.fallback();
  }
}
