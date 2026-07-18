import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { TimelineEvent } from "@/server/types/domain";

import { evidenceRepository } from "@/server/repositories/evidence-repository";
import { fallbackStore } from "@/server/repositories/fallback-store";
import {
  timelineEventFromRow,
  timelineEventToRow,
} from "@/server/repositories/mappers";
import {
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

const newestFirst = (left: TimelineEvent, right: TimelineEvent) =>
  Date.parse(right.recordedAt) - Date.parse(left.recordedAt);

const exactNonEmptyString = z.string().refine((value) => value.trim().length > 0);
const liveVoiceProjectionSchema = z.object({
  patientId: z.string().uuid(),
  patientUpdateId: z.string().uuid(),
  evidenceRecordId: z.string().uuid(),
  originalTranscript: exactNonEmptyString,
  englishTranslation: z.string().optional(),
  detectedLanguage: z.string().optional(),
  transcriptionMode: z.literal("runware"),
  occurredAt: z.string().datetime({ offset: true }),
});

export class TimelineRepository {
  async listByPatient(patientId: string): Promise<TimelineEvent[]> {
    return withRepositoryFallback({
      scope: "TimelineRepository.listByPatient",
      remote: async (client) => {
        const { data, error } = await client
          .from("timeline_events")
          .select("*")
          .eq("patient_id", patientId)
          .order("recorded_at", { ascending: false });

        requireSuccessfulQuery("TimelineRepository.listByPatient", error);
        const rows = data ?? [];
        const ids = rows.map((row) => String(row.id));
        const [evidence, liveEvidence] = await Promise.all([
          evidenceRepository.listForObservations(ids),
          evidenceRepository.listLiveForPatient(patientId),
        ]);

        return rows.map((row) => {
          const id = String(row.id);
          const structuredData =
            row.structured_data && typeof row.structured_data === "object"
              ? (row.structured_data as Record<string, unknown>)
              : {};
          const evidenceRecordId = structuredData.evidenceRecordId
            ? String(structuredData.evidenceRecordId)
            : undefined;
          const attachedEvidence = [
            ...evidence.filter((reference) => reference.observationId === id),
            ...liveEvidence
              .filter((reference) => reference.id === evidenceRecordId)
              .map((reference) => ({ ...reference, observationId: id })),
          ];
          return timelineEventFromRow(
            row as unknown as Record<string, unknown>,
            attachedEvidence,
          );
        });
      },
      fallback: () =>
        structuredClone(
          fallbackStore.timelineEvents
            .filter((event) => event.patientId === patientId)
            .sort(newestFirst),
        ),
    });
  }

  async findById(eventId: string): Promise<TimelineEvent | null> {
    return withRepositoryFallback({
      scope: "TimelineRepository.findById",
      remote: async (client) => {
        const { data, error } = await client
          .from("timeline_events")
          .select("*")
          .eq("id", eventId)
          .maybeSingle();

        requireSuccessfulQuery("TimelineRepository.findById", error);
        if (!data) return null;

        const evidence = await evidenceRepository.listForObservation(eventId);
        return timelineEventFromRow(
          data as unknown as Record<string, unknown>,
          evidence,
        );
      },
      fallback: () => {
        const event = fallbackStore.timelineEvents.find(
          (candidate) => candidate.id === eventId,
        );
        return event ? structuredClone(event) : null;
      },
    });
  }

  async save(event: TimelineEvent): Promise<TimelineEvent> {
    return withRepositoryFallback({
      scope: "TimelineRepository.save",
      remote: async (client) => {
        const { data, error } = await client
          .from("timeline_events")
          .upsert(timelineEventToRow(event), { onConflict: "id" })
          .select("*")
          .single();

        requireSuccessfulQuery("TimelineRepository.save", error);
        return timelineEventFromRow(
          data as unknown as Record<string, unknown>,
          event.evidenceRefs,
        );
      },
      fallback: () => {
        const index = fallbackStore.timelineEvents.findIndex(
          (candidate) => candidate.id === event.id,
        );

        if (index >= 0) fallbackStore.timelineEvents[index] = structuredClone(event);
        else fallbackStore.timelineEvents.push(structuredClone(event));

        return structuredClone(event);
      },
    });
  }

  async createLiveVoiceProjection(
    input: z.infer<typeof liveVoiceProjectionSchema>,
  ): Promise<TimelineEvent> {
    const validated = liveVoiceProjectionSchema.parse(input);
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error(
        "SUPABASE_SECRET_KEY is not configured for timeline projection.",
      );
    }

    const timelineEventId = randomUUID();
    const metadata = {
      synthetic: false,
      enteredBy: "patient",
      inputMode: "voice",
      transcriptionProvider: "runware",
      transcriptionMode: validated.transcriptionMode,
    };
    const event: TimelineEvent = {
      id: timelineEventId,
      patientId: validated.patientId,
      type: "patient_voice",
      title: "Patient voice update",
      summary:
        validated.englishTranslation ?? validated.originalTranscript,
      recordedAt: validated.occurredAt,
      sourceKind: "patient_reported",
      location: "Home",
      ...(validated.detectedLanguage
        ? {
            language:
              validated.detectedLanguage.toLowerCase() === "urdu"
                ? "ur"
                : validated.detectedLanguage,
          }
        : {}),
      originalText: validated.originalTranscript,
      ...(validated.englishTranslation === undefined
        ? {}
        : { translatedText: validated.englishTranslation }),
      metadata,
      structuredData: {
        patientUpdateId: validated.patientUpdateId,
        evidenceRecordId: validated.evidenceRecordId,
        metadata,
      },
    };
    const { data, error } = await client
      .from("timeline_events")
      .insert(timelineEventToRow(event))
      .select("*")
      .single();

    if (error || !data || !z.string().uuid().safeParse(data.id).success) {
      const { error: cleanupError } = await client
        .from("timeline_events")
        .delete()
        .eq("id", timelineEventId)
        .eq("patient_id", validated.patientId);
      if (cleanupError) {
        console.error(
          "[Thread persistence] Failed to clean up timeline projection",
          cleanupError,
        );
      }
      requireSuccessfulQuery("TimelineRepository.createLiveVoiceProjection", error);
      throw new Error("Supabase returned an invalid timeline projection row.");
    }

    return timelineEventFromRow(
      data as unknown as Record<string, unknown>,
    );
  }
}

export const timelineRepository = new TimelineRepository();
