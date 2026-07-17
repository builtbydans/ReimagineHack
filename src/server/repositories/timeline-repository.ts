import "server-only";

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
        const evidence = await evidenceRepository.listForObservations(ids);

        return rows.map((row) => {
          const id = String(row.id);
          return timelineEventFromRow(
            row as unknown as Record<string, unknown>,
            evidence.filter((reference) => reference.observationId === id),
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
}

export const timelineRepository = new TimelineRepository();

