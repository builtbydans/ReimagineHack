import "server-only";

const optional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Server-only environment access. Keep credentials behind route handlers and
 * services so no secret is ever included in the browser bundle.
 */
export const env = {
  supabaseUrl: optional(process.env.SUPABASE_URL),
  supabaseKey: optional(process.env.SUPABASE_KEY),
  geminiApiKey: optional(process.env.GEMINI_API_KEY),
  runwareApiKey: optional(process.env.RUNWARE_API_KEY),
  appUrl:
    optional(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseKey,
);

export const isGeminiConfigured = Boolean(env.geminiApiKey);
export const isRunwareConfigured = Boolean(env.runwareApiKey);

export const isDevelopment = env.nodeEnv !== "production";

