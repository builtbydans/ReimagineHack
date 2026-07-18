import "server-only";

import { z } from "zod";

import {
  evidenceRepository,
  type EvidenceRepository,
} from "@/server/repositories/evidence-repository";
import {
  patientUpdateRepository,
  type PatientUpdateRepository,
} from "@/server/repositories/patient-update-repository";
import {
  timelineRepository,
  type TimelineRepository,
} from "@/server/repositories/timeline-repository";
import type {
  EvidenceRecord,
  PatientUpdate,
  TimelineEvent,
} from "@/server/types/domain";
import type { TranscriptionResult } from "@/server/services/transcription-service";

const nonEmptyExactString = z.string().refine((value) => value.trim().length > 0);
const persistenceInputSchema = z.object({
  patientId: z.string().uuid(),
  preferredLanguage: nonEmptyExactString.optional(),
  transcription: z.object({
    detectedLanguage: nonEmptyExactString.optional(),
    originalTranscript: nonEmptyExactString,
    englishTranslation: z.string().optional(),
    mode: z.enum(["fallback", "runware"]),
    notice: z.string().optional(),
  }),
  occurredAt: z
    .string()
    .datetime({ offset: true, message: "Use an ISO 8601 date and time." }),
});

export type PersistedVoiceTranscription = {
  patientUpdate: PatientUpdate;
  evidence: EvidenceRecord;
  timelineEvent?: TimelineEvent;
  timelineProjection: "completed" | "failed";
};

export class TranscriptionPersistenceError extends Error {
  readonly code = "TRANSCRIPTION_PERSISTENCE_FAILED";

  constructor(
    message: string,
    public readonly persistenceCause: unknown,
  ) {
    super(message);
    this.name = "TranscriptionPersistenceError";
  }
}

export class TranscriptionPersistenceService {
  constructor(
    private readonly patientUpdates: PatientUpdateRepository,
    private readonly evidence: EvidenceRepository,
    private readonly timeline: TimelineRepository,
  ) {}

  async persistVoiceTranscription(input: {
    patientId: string;
    preferredLanguage?: string;
    transcription: TranscriptionResult;
    occurredAt: string;
  }): Promise<PersistedVoiceTranscription> {
    const validated = persistenceInputSchema.parse(input);
    const { patientId, preferredLanguage, transcription, occurredAt } = validated;

    console.info("[Thread persistence] Saving voice transcription", {
      patientId,
      mode: transcription.mode,
      detectedLanguage: transcription.detectedLanguage,
      hasTranslation: Boolean(transcription.englishTranslation),
      transcriptLength: transcription.originalTranscript.length,
    });

    let patientUpdate: PatientUpdate | undefined;
    try {
      patientUpdate = await this.patientUpdates.createVoiceUpdate({
        patientId,
        originalTranscript: transcription.originalTranscript,
        originalLanguage:
          transcription.detectedLanguage ?? preferredLanguage ?? "Unknown",
        ...(transcription.englishTranslation === undefined
          ? {}
          : { englishTranslation: transcription.englishTranslation }),
        processingStatus: "completed",
        occurredAt,
      });

      const evidence = await this.evidence.createVoiceTranscriptEvidence({
        patientId,
        patientUpdateId: patientUpdate.id,
        originalTranscript: transcription.originalTranscript,
        ...(transcription.englishTranslation === undefined
          ? {}
          : { translatedTranscript: transcription.englishTranslation }),
        ...(transcription.detectedLanguage === undefined
          ? {}
          : { detectedLanguage: transcription.detectedLanguage }),
        ...(preferredLanguage === undefined ? {} : { preferredLanguage }),
        transcriptionProvider:
          transcription.mode === "runware" ? "runware" : "synthetic-fallback",
        transcriptionMode: transcription.mode,
        occurredAt,
      });

      console.info("[Thread persistence] Voice transcription saved", {
        patientId,
        patientUpdateId: patientUpdate.id,
        evidenceId: evidence.id,
      });

      try {
        const timelineEvent = await this.timeline.createLiveVoiceProjection({
          patientId,
          patientUpdateId: patientUpdate.id,
          evidenceRecordId: evidence.id,
          originalTranscript: transcription.originalTranscript,
          ...(transcription.englishTranslation === undefined
            ? {}
            : { englishTranslation: transcription.englishTranslation }),
          ...(transcription.detectedLanguage === undefined
            ? {}
            : { detectedLanguage: transcription.detectedLanguage }),
          transcriptionMode: "runware",
          occurredAt,
        });

        console.info("[Thread persistence] Timeline projection saved", {
          patientId,
          timelineEventId: timelineEvent.id,
        });
        return {
          patientUpdate,
          evidence,
          timelineEvent,
          timelineProjection: "completed",
        };
      } catch (timelineError) {
        console.error(
          "[Thread persistence] Raw transcription saved but timeline projection failed",
          timelineError,
        );
        return {
          patientUpdate,
          evidence,
          timelineProjection: "failed",
        };
      }
    } catch (error) {
      if (patientUpdate) {
        try {
          await this.patientUpdates.deleteById(patientUpdate.id, patientId);
        } catch (cleanupError) {
          console.error(
            "[Thread persistence] Failed to clean up partial voice transcription",
            cleanupError,
          );
        }
      }

      throw new TranscriptionPersistenceError(
        "The recording was transcribed but could not be saved.",
        error,
      );
    }
  }
}

export const transcriptionPersistenceService =
  new TranscriptionPersistenceService(
    patientUpdateRepository,
    evidenceRepository,
    timelineRepository,
  );
