import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { EvidenceRecord, EvidenceReference } from "@/server/types/domain";

import { fallbackStore } from "@/server/repositories/fallback-store";
import {
  evidenceFromRow,
  evidenceRecordFromRow,
  liveEvidenceFromRow,
} from "@/server/repositories/mappers";
import {
  RepositoryError,
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

const nonEmptyExactString = z.string().refine((value) => value.trim().length > 0);
const voiceTranscriptEvidenceInputSchema = z.object({
  patientId: z.string().uuid(),
  patientUpdateId: z.string().uuid(),
  originalTranscript: nonEmptyExactString,
  translatedTranscript: z.string().optional(),
  detectedLanguage: z.string().optional(),
  preferredLanguage: z.string().optional(),
  transcriptionProvider: z.enum(["runware", "synthetic-fallback"]),
  transcriptionMode: z.enum(["runware", "fallback"]),
  occurredAt: z
    .string()
    .datetime({ offset: true, message: "Use an ISO 8601 date and time." }),
});

const evidenceRecordRowSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    source_type: z.string(),
    source_id: z.string().uuid().nullable(),
    title: z.string(),
    original_content: z.string(),
    translated_content: z.string().nullable(),
    occurred_at: z.string(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
  })
  .passthrough();

export type CreateVoiceTranscriptEvidenceInput = z.infer<
  typeof voiceTranscriptEvidenceInputSchema
>;

export class EvidenceRepository {
  async createVoiceTranscriptEvidence(
    input: CreateVoiceTranscriptEvidenceInput,
  ): Promise<EvidenceRecord> {
    const validated = voiceTranscriptEvidenceInputSchema.parse(input);
    const client = getSupabaseAdmin();
    if (!client) {
      throw new RepositoryError(
        "EvidenceRepository.createVoiceTranscriptEvidence",
        "SUPABASE_SECRET_KEY is not configured for live transcription persistence.",
      );
    }

    const evidenceId = randomUUID();
    const { data, error } = await client
      .from("evidence_records")
      .insert({
        id: evidenceId,
        patient_id: validated.patientId,
        source_type: "voice_transcript",
        source_id: validated.patientUpdateId,
        title: "Patient voice update",
        original_content: validated.originalTranscript,
        translated_content: validated.translatedTranscript ?? null,
        occurred_at: validated.occurredAt,
        metadata: {
          inputType: "voice",
          detectedLanguage: validated.detectedLanguage ?? null,
          preferredLanguage: validated.preferredLanguage ?? null,
          transcriptionProvider: validated.transcriptionProvider,
          transcriptionMode: validated.transcriptionMode,
        },
      })
      .select(
        "id, patient_id, source_type, source_id, title, original_content, translated_content, occurred_at, metadata, created_at",
      )
      .single();

    const row = evidenceRecordRowSchema.safeParse(data);
    if (error || !row.success) {
      const { error: cleanupError } = await client
        .from("evidence_records")
        .delete()
        .eq("id", evidenceId)
        .eq("patient_id", validated.patientId);
      if (cleanupError) {
        console.error(
          "[Thread persistence] Failed to clean up an invalid evidence response",
          cleanupError,
        );
      }
      requireSuccessfulQuery(
        "EvidenceRepository.createVoiceTranscriptEvidence",
        error,
      );
      throw new RepositoryError(
        "EvidenceRepository.createVoiceTranscriptEvidence",
        "Supabase returned an invalid evidence record row.",
      );
    }

    return evidenceRecordFromRow(row.data);
  }

  async listForObservation(observationId: string): Promise<EvidenceReference[]> {
    return withRepositoryFallback({
      scope: "EvidenceRepository.listForObservation",
      remote: async (client) => {
        const { data, error } = await client
          .from("evidence_references")
          .select("*")
          .eq("event_id", observationId)
          .order("recorded_at", { ascending: true });

        requireSuccessfulQuery("EvidenceRepository.listForObservation", error);
        return (data ?? []).map((row) =>
          evidenceFromRow(row as unknown as Record<string, unknown>),
        );
      },
      fallback: () =>
        structuredClone(
          fallbackStore.evidenceReferences.filter(
            (reference) => reference.observationId === observationId,
          ),
        ),
    });
  }

  async listLiveForPatient(patientId: string): Promise<EvidenceReference[]> {
    const validatedPatientId = z.string().uuid().parse(patientId);
    return withRepositoryFallback({
      scope: "EvidenceRepository.listLiveForPatient",
      remote: async (client) => {
        const { data, error } = await client
          .from("evidence_records")
          .select(
            "id, patient_id, source_type, source_id, title, original_content, translated_content, occurred_at, metadata, created_at",
          )
          .eq("patient_id", validatedPatientId)
          .order("occurred_at", { ascending: false });

        requireSuccessfulQuery("EvidenceRepository.listLiveForPatient", error);
        return (data ?? []).map((row) =>
          liveEvidenceFromRow(row as unknown as Record<string, unknown>),
        );
      },
      fallback: () => [],
    });
  }

  async listForObservations(
    observationIds: string[],
  ): Promise<EvidenceReference[]> {
    if (observationIds.length === 0) return [];

    return withRepositoryFallback({
      scope: "EvidenceRepository.listForObservations",
      remote: async (client) => {
        const { data, error } = await client
          .from("evidence_references")
          .select("*")
          .in("event_id", observationIds)
          .order("recorded_at", { ascending: true });

        requireSuccessfulQuery("EvidenceRepository.listForObservations", error);
        return (data ?? []).map((row) =>
          evidenceFromRow(row as unknown as Record<string, unknown>),
        );
      },
      fallback: () => {
        const wanted = new Set(observationIds);
        return structuredClone(
          fallbackStore.evidenceReferences.filter(
            (reference) =>
              reference.observationId && wanted.has(reference.observationId),
          ),
        );
      },
    });
  }
}

export const evidenceRepository = new EvidenceRepository();
