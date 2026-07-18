import "server-only";

import { GoogleGenAI } from "@google/genai";

import { env, isGeminiConfigured } from "@/lib/env";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

let client: GoogleGenAI | null | undefined;

export const getGeminiClient = (): GoogleGenAI | null => {
  if (!isGeminiConfigured || !env.geminiApiKey) return null;
  if (client === undefined) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
};

export const getGeminiModel = () =>
  env.geminiModel ?? DEFAULT_GEMINI_MODEL;
