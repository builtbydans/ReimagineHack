import "server-only";

import {
  FALLBACK_ROMAN_URDU_TRANSCRIPT,
  FALLBACK_ROMAN_URDU_TRANSLATION,
  FALLBACK_TRANSCRIPT,
} from "@/lib/constants";
import { env, isRunwareConfigured } from "@/lib/env";

export type TranscriptionResult = {
  detectedLanguage?: string;
  originalTranscript: string;
  englishTranslation?: string;
  mode: "fallback" | "runware";
  notice?: string;
};

export interface TranscriptionService {
  transcribe(input: {
    audio: Buffer;
    mimeType: string;
    preferredLanguage?: string;
  }): Promise<TranscriptionResult>;
}

export class TranscriptionProviderUnavailableError extends Error {
  readonly code = "TRANSCRIPTION_PROVIDER_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "TranscriptionProviderUnavailableError";
  }
}

export class FallbackTranscriptionService implements TranscriptionService {
  async transcribe(input: {
    audio: Buffer;
    mimeType: string;
    preferredLanguage?: string;
  }): Promise<TranscriptionResult> {
    const prefersUrdu = input.preferredLanguage?.toLowerCase().includes("urdu");

    return {
      detectedLanguage: prefersUrdu ? "Urdu" : "English",
      originalTranscript: prefersUrdu
        ? FALLBACK_ROMAN_URDU_TRANSCRIPT
        : FALLBACK_TRANSCRIPT,
      englishTranslation: prefersUrdu
        ? FALLBACK_ROMAN_URDU_TRANSLATION
        : undefined,
      mode: "fallback",
      notice:
        "Synthetic fallback transcript used because live transcription is not configured.",
    };
  }
}

/**
 * Server-side seam for a future Runware transcription integration.
 *
 * Runware's public audio API does not currently expose speech-to-text as a
 * supported task type. We therefore do not fabricate a request shape here.
 * Once a supported model and contract are confirmed, this adapter is the only
 * place that needs to change; the browser and route contract remain stable.
 */
export class RunwareTranscriptionService implements TranscriptionService {
  constructor(private readonly apiKey: string) {}

  async transcribe(input: {
    audio: Buffer;
    mimeType: string;
    preferredLanguage?: string;
  }): Promise<TranscriptionResult> {
    void this.apiKey;
    void input;

    throw new TranscriptionProviderUnavailableError(
      "RUNWARE_API_KEY is configured, but a supported Runware speech-to-text request contract has not been confirmed. Remove the key to use the synthetic demo transcript.",
    );
  }
}

export const createTranscriptionService = (): TranscriptionService =>
  isRunwareConfigured
    ? new RunwareTranscriptionService(env.runwareApiKey!)
    : new FallbackTranscriptionService();

