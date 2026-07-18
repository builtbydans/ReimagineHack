import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase";
import { patientUpdateFromRow } from "@/server/repositories/mappers";
import {
  RepositoryError,
  requireSuccessfulQuery,
} from "@/server/repositories/repository-support";
import type { PatientUpdate } from "@/server/types/domain";

const nonEmptyExactString = z.string().refine((value) => value.trim().length > 0);
const occurredAtSchema = z
  .string()
  .datetime({ offset: true, message: "Use an ISO 8601 date and time." });

const voiceUpdateInputSchema = z.object({
  patientId: z.string().uuid(),
  originalTranscript: nonEmptyExactString,
  originalLanguage: nonEmptyExactString,
  englishTranslation: z.string().optional(),
  occurredAt: occurredAtSchema,
  processingStatus: z.literal("completed"),
});

const patientUpdateRowSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    input_type: z.enum(["voice", "text", "symptom", "medication"]),
    original_text: z.string(),
    original_language: z.string(),
    english_translation: z.string().nullable(),
    processing_status: z.enum(["pending", "processing", "completed", "failed"]),
    processing_error: z.string().nullable(),
    occurred_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export type CreateVoiceUpdateInput = z.infer<typeof voiceUpdateInputSchema>;

const getClient = () => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new RepositoryError(
      "PatientUpdateRepository",
      "SUPABASE_SECRET_KEY is not configured for live transcription persistence.",
    );
  }
  return client;
};

export class PatientUpdateRepository {
  async createVoiceUpdate(input: CreateVoiceUpdateInput): Promise<PatientUpdate> {
    const validated = voiceUpdateInputSchema.parse(input);
    const client = getClient();
    const patientUpdateId = randomUUID();
    const { data, error } = await client
      .from("patient_updates")
      .insert({
        id: patientUpdateId,
        patient_id: validated.patientId,
        input_type: "voice",
        original_text: validated.originalTranscript,
        original_language: validated.originalLanguage,
        english_translation: validated.englishTranslation ?? null,
        processing_status: validated.processingStatus,
        processing_error: null,
        occurred_at: validated.occurredAt,
      })
      .select(
        "id, patient_id, input_type, original_text, original_language, english_translation, processing_status, processing_error, occurred_at, created_at, updated_at",
      )
      .single();

    const row = patientUpdateRowSchema.safeParse(data);
    if (error || !row.success) {
      const { error: cleanupError } = await client
        .from("patient_updates")
        .delete()
        .eq("id", patientUpdateId)
        .eq("patient_id", validated.patientId);
      if (cleanupError) {
        console.error(
          "[Thread persistence] Failed to clean up an invalid patient update response",
          cleanupError,
        );
      }
      requireSuccessfulQuery("PatientUpdateRepository.createVoiceUpdate", error);
      throw new RepositoryError(
        "PatientUpdateRepository.createVoiceUpdate",
        "Supabase returned an invalid patient update row.",
      );
    }

    return patientUpdateFromRow(row.data);
  }

  async deleteById(patientUpdateId: string, patientId: string): Promise<void> {
    const validatedId = z.string().uuid().parse(patientUpdateId);
    const validatedPatientId = z.string().uuid().parse(patientId);
    const { error } = await getClient()
      .from("patient_updates")
      .delete()
      .eq("id", validatedId)
      .eq("patient_id", validatedPatientId);

    requireSuccessfulQuery("PatientUpdateRepository.deleteById", error);
  }
}

export const patientUpdateRepository = new PatientUpdateRepository();
