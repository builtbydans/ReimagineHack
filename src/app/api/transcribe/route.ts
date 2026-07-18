import { apiError, apiSuccess, handleRouteError } from "@/server/http/api-response";
import { AMINA_PATIENT_ID } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { transcribeMetadataSchema } from "@/server/schemas";
import {
  transcriptionPersistenceService,
  TranscriptionPersistenceError,
} from "@/server/services/transcription-persistence-service";
import { createTranscriptionService } from "@/server/services/transcription-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return apiError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Send the recording as multipart form data with an audio field.",
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return apiError(
        400,
        "AUDIO_REQUIRED",
        "Choose or record an audio update before submitting.",
      );
    }

    const preferredLanguageValue = formData.get("preferredLanguage");
    const preferredLanguage =
      typeof preferredLanguageValue === "string" && preferredLanguageValue.trim()
        ? preferredLanguageValue
        : undefined;

    const metadata = transcribeMetadataSchema.parse({
      preferredLanguage,
      mimeType: audio.type,
      byteLength: audio.size,
    });

    const result = await createTranscriptionService().transcribe({
      audio: Buffer.from(await audio.arrayBuffer()),
      mimeType: metadata.mimeType,
      preferredLanguage: metadata.preferredLanguage,
    });

    if (result.mode !== "runware") {
      return apiSuccess(
        {
          transcription: { ...result, persisted: false },
          safety:
            "Thread organised this transcript for review. It is patient-reported and not clinically verified.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    let persisted;
    try {
      persisted =
        await transcriptionPersistenceService.persistVoiceTranscription({
          patientId: AMINA_PATIENT_ID,
          ...(metadata.preferredLanguage === undefined
            ? {}
            : { preferredLanguage: metadata.preferredLanguage }),
          transcription: result,
          occurredAt: new Date().toISOString(),
        });
    } catch (error) {
      if (error instanceof TranscriptionPersistenceError) {
        console.error(
          "[Thread persistence] Live transcription could not be saved",
          error.persistenceCause,
        );
        return apiError(
          500,
          error.code,
          "Your recording was transcribed, but Thread could not save it to your health story. Please try again.",
          { transcription: result },
        );
      }
      throw error;
    }

    if (persisted.timelineProjection === "completed") {
      revalidatePath("/clinician", "layout");
    }

    return apiSuccess(
      {
        transcription: {
          ...result,
          patientUpdateId: persisted.patientUpdate.id,
          evidenceId: persisted.evidence.id,
          ...(persisted.timelineEvent
            ? { timelineEventId: persisted.timelineEvent.id }
            : {}),
          persisted: persisted.timelineProjection === "completed",
          rawPersisted: true,
          persistenceStatus:
            persisted.timelineProjection === "completed"
              ? "completed"
              : "raw_saved_timeline_failed",
          ...(persisted.timelineProjection === "failed"
            ? {
                notice:
                  "Your recording was saved, but it could not yet be added to the clinician timeline.",
              }
            : {}),
        },
        safety:
          "Thread organised this transcript for review. It is patient-reported and not clinically verified.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
