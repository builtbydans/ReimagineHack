import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { TranscriptionProviderUnavailableError } from "@/server/services/transcription-service";
import { AiProviderError } from "@/server/services/ai-extraction-service";
import { DomainServiceError } from "@/server/services/service-error";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const apiSuccess = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, data }, init);

export const apiError = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
) =>
  NextResponse.json<ApiErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );

export const handleRouteError = (error: unknown) => {
  if (error instanceof ZodError) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Some of the submitted information needs attention.",
      error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  if (error instanceof SyntaxError) {
    return apiError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }

  if (error instanceof TranscriptionProviderUnavailableError) {
    return apiError(501, error.code, error.message);
  }

  if (error instanceof DomainServiceError) {
    return apiError(error.status, error.code, error.message);
  }

  if (error instanceof AiProviderError) {
    console.error("[Thread API] Gemini provider error", error.message);
    return apiError(
      502,
      error.code,
      "Thread could not organise the update with the configured AI provider. Check the server integration and try again.",
    );
  }

  console.error("[Thread API] Unexpected route error", error);

  return apiError(
    500,
    "INTERNAL_ERROR",
    "Thread could not complete that request. Please try again.",
  );
};
