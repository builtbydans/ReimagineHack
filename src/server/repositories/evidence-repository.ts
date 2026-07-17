import "server-only";

import type { EvidenceReference } from "@/server/types/domain";

import { fallbackStore } from "@/server/repositories/fallback-store";
import { evidenceFromRow } from "@/server/repositories/mappers";
import {
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

export class EvidenceRepository {
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

