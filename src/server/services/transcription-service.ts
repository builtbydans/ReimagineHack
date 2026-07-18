import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
  FALLBACK_TRANSCRIPT,
  FALLBACK_URDU_TRANSCRIPT,
  FALLBACK_URDU_TRANSLATION,
} from "@/lib/constants";
import { env, isRunwareConfigured } from "@/lib/env";

const RUNWARE_API_URL = "https://api.runware.ai/v1";
const RUNWARE_TRANSCRIPTION_MODEL = "google:gemini@3.1-flash-lite";

function normaliseAudioMimeType(mimeType: string): string {
  const baseMimeType = mimeType.split(";")[0].trim().toLowerCase();

  if (
    baseMimeType === "audio/wav" ||
    baseMimeType === "audio/x-wav" ||
    baseMimeType === "audio/wave"
  ) {
    return "audio/wav";
  }

  if (baseMimeType === "audio/webm") {
    return "audio/webm";
  }

  if (baseMimeType === "audio/ogg") {
    return "audio/ogg";
  }

  if (baseMimeType === "audio/mpeg") {
    return "audio/mpeg";
  }

  if (baseMimeType === "audio/mp4") {
    return "audio/mp4";
  }

  throw new TranscriptionProviderUnavailableError(
    `Unsupported audio MIME type: ${mimeType || "unknown"}.`,
  );
}

const transcriptionPayloadSchema = z
  .object({
    detectedLanguage: z.string().trim().min(1),
    originalTranscript: z.string().trim().min(1),
    englishTranslation: z.string().trim().min(1),
  })
  .strict();

const runwareErrorSchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    taskUUID: z.string().optional(),
  })
  .passthrough();

const runwareResponseSchema = z
  .object({
    data: z.array(z.unknown()).optional(),
    error: z.union([z.string(), runwareErrorSchema]).optional(),
    errors: z.array(runwareErrorSchema).optional(),
  })
  .passthrough();

const runwareTextResultSchema = z
  .object({
    taskType: z.literal("textInference"),
    taskUUID: z.string().uuid(),
    text: z.string().trim().min(1),
  })
  .passthrough();

const TRANSCRIPTION_INSTRUCTION = `You are a precise multilingual medical transcription assistant. Transcribe the attached patient speech and return JSON only, with no markdown or commentary.

Requirements:
1. Detect the spoken language.
2. Transcribe the speech faithfully in the language's natural writing system.
3. If the language is Urdu, return the original transcript in Urdu script, never Roman Urdu.
4. Translate the transcript into clear English.
5. Preserve symptoms, timing, medication names, severity numbers, functional impact, and patient uncertainty exactly.
6. Do not diagnose, interpret, or add medical facts.
7. If audio is unclear, mark uncertain wording with [unclear] rather than inventing it.

Return exactly this JSON structure:
{
  "detectedLanguage": "Urdu",
  "originalTranscript": "Urdu script here",
  "englishTranslation": "English translation here"
}`;

const describeZodIssues = (error: z.ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
    .join("; ");

const parseTranscriptionText = (text: string) => {
  const trimmed = text.trim();
  const fencedJson = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed)?.[1];
  const candidates = fencedJson ? [fencedJson, trimmed] : [trimmed];
  let validationError: z.ZodError | undefined;

  for (const candidate of candidates) {
    try {
      const parsed = transcriptionPayloadSchema.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
      validationError = parsed.error;
    } catch {
      // Try the next safe representation, such as a single fenced JSON block.
    }
  }

  if (validationError) {
    throw new Error(
      `Runware returned JSON that did not match the transcription schema (${describeZodIssues(validationError)}).`,
    );
  }

  throw new Error("Runware returned transcription text that was not valid JSON.");
};

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
        ? FALLBACK_URDU_TRANSCRIPT
        : FALLBACK_TRANSCRIPT,
      englishTranslation: prefersUrdu
        ? FALLBACK_URDU_TRANSLATION
        : undefined,
      mode: "fallback",
      notice:
        "Synthetic fallback transcript used because live transcription is not configured.",
    };
  }
}

export class RunwareTranscriptionService implements TranscriptionService {
  constructor(private readonly apiKey: string) {}

  private providerError(message: string) {
    const safeMessage = this.apiKey
      ? message.split(this.apiKey).join("[redacted]")
      : message;
    return new TranscriptionProviderUnavailableError(safeMessage);
  }

  async transcribe(input: {
    audio: Buffer;
    mimeType: string;
    preferredLanguage?: string;
  }): Promise<TranscriptionResult> {
    const taskUUID = randomUUID();
    const audioMimeType = normaliseAudioMimeType(input.mimeType);
    const audioDataUri = `data:${audioMimeType};base64,${input.audio.toString("base64")}`;
    const preferredLanguageHint = input.preferredLanguage ?? "not provided";

    console.info("[Thread transcription]", {
      incomingMimeType: input.mimeType,
      normalisedMimeType: audioMimeType,
      bytes: input.audio.length,
      signature: input.audio.subarray(0, 12).toString("ascii"),
    });

    let response: Response;
    try {
      response = await fetch(RUNWARE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            taskType: "textInference",
            taskUUID,
            model: RUNWARE_TRANSCRIPTION_MODEL,
            deliveryMethod: "sync",
            numberResults: 1,
            outputFormat: "TEXT",
            inputs: {
              audios: [audioDataUri],
            },
            messages: [
              {
                role: "user",
                content: `Transcribe the attached patient recording. The preferred-language hint is ${JSON.stringify(preferredLanguageHint)}; use it only as a hint and detect the actual spoken language.`,
              },
            ],
            settings: {
              systemPrompt: TRANSCRIPTION_INSTRUCTION,
              temperature: 0,
              maxTokens: 4_096,
            },
          },
        ]),
      });
    } catch {
      throw this.providerError(
        `Runware task ${taskUUID} could not reach the transcription provider.`,
      );
    }

    let rawResponse: unknown;
    try {
      rawResponse = await response.json();
    } catch {
      throw this.providerError(
        `Runware task ${taskUUID} returned an unreadable response (HTTP ${response.status}).`,
      );
    }

    const envelope = runwareResponseSchema.safeParse(rawResponse);
    const runwareErrors = envelope.success
      ? [
          ...(envelope.data.errors ?? []),
          ...(typeof envelope.data.error === "string"
            ? [{ message: envelope.data.error }]
            : envelope.data.error
              ? [envelope.data.error]
              : []),
        ]
      : [];
    const errorDetails = runwareErrors
      .map((error) => [error.code, error.message].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("; ");

    if (!response.ok) {
      throw this.providerError(
        `Runware task ${taskUUID} failed with HTTP ${response.status}${errorDetails ? ` (${errorDetails})` : ""}.`,
      );
    }

    if (!envelope.success) {
      throw this.providerError(
        `Runware task ${taskUUID} returned an invalid response envelope (${describeZodIssues(envelope.error)}).`,
      );
    }

    if (runwareErrors.length) {
      throw this.providerError(
        `Runware task ${taskUUID} returned an error${errorDetails ? ` (${errorDetails})` : ""}.`,
      );
    }

    const matchingRawResult = envelope.data.data?.find(
      (result) =>
        typeof result === "object" &&
        result !== null &&
        "taskUUID" in result &&
        result.taskUUID === taskUUID,
    );

    if (!matchingRawResult) {
      throw this.providerError(
        `Runware response did not contain a result for task ${taskUUID}.`,
      );
    }

    const matchingResult = runwareTextResultSchema.safeParse(matchingRawResult);
    if (!matchingResult.success) {
      throw this.providerError(
        `Runware task ${taskUUID} returned an invalid text result (${describeZodIssues(matchingResult.error)}).`,
      );
    }

    let transcription: z.infer<typeof transcriptionPayloadSchema>;
    try {
      transcription = parseTranscriptionText(matchingResult.data.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid transcription payload.";
      throw this.providerError(`Runware task ${taskUUID} failed validation: ${message}`);
    }

    return {
      ...transcription,
      mode: "runware",
    };
  }
}

class RunwareWithFallbackTranscriptionService implements TranscriptionService {
  constructor(
    private readonly runware: RunwareTranscriptionService,
    private readonly fallback: FallbackTranscriptionService,
  ) {}

  async transcribe(
    input: Parameters<TranscriptionService["transcribe"]>[0],
  ): Promise<TranscriptionResult> {
    try {
      return await this.runware.transcribe(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Runware failure.";
      console.warn(
        "[Thread transcription] Runware unavailable; using synthetic fallback.",
        message,
      );
      if (!env.transcriptionFallbackEnabled) throw error;

      const fallback = await this.fallback.transcribe(input);
      return {
        ...fallback,
        notice:
          "Live transcription failed, so this preview uses the synthetic demonstration transcript.",
      };
    }
  }
}

export const createTranscriptionService = (): TranscriptionService =>
  isRunwareConfigured && env.runwareApiKey
    ? new RunwareWithFallbackTranscriptionService(
        new RunwareTranscriptionService(env.runwareApiKey),
        new FallbackTranscriptionService(),
      )
    : new FallbackTranscriptionService();
