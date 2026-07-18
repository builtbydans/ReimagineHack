import "server-only";

const optional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const booleanFlag = (value: string | undefined, fallback: boolean) => {
  const normalised = optional(value)?.toLowerCase();
  if (!normalised) return fallback;
  return ["1", "true", "yes", "on"].includes(normalised);
};

/**
 * Server-only environment access. Keep credentials behind route handlers and
 * services so no secret is ever included in the browser bundle.
 */
export const env = {
  supabaseUrl: optional(process.env.SUPABASE_URL),
  supabaseKey: optional(process.env.SUPABASE_KEY),
  supabaseSecretKey:
    optional(process.env.SUPABASE_SECRET_KEY) ??
    optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
  geminiApiKey: optional(process.env.GEMINI_API_KEY),
  geminiModel: optional(process.env.GEMINI_MODEL),
  runwareApiKey: optional(process.env.RUNWARE_API_KEY),
  transcriptionFallbackEnabled: booleanFlag(
    process.env.TRANSCRIPTION_FALLBACK_ENABLED,
    true,
  ),
  appUrl:
    optional(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseKey,
);

export const isSupabaseAdminConfigured = Boolean(
  env.supabaseUrl && env.supabaseSecretKey,
);

export const isGeminiConfigured = Boolean(env.geminiApiKey);
export const isRunwareConfigured = Boolean(env.runwareApiKey);

export const isDevelopment = env.nodeEnv !== "production";
