import "server-only";

import type { ImportedEncounter } from "@/server/types/domain";

import { fallbackStore } from "@/server/repositories/fallback-store";
import {
  importedEncounterFromRow,
  importedEncounterToRow,
} from "@/server/repositories/mappers";
import {
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

export class ImportedEncounterRepository {
  async listByPatient(patientId: string): Promise<ImportedEncounter[]> {
    return withRepositoryFallback({
      scope: "ImportedEncounterRepository.listByPatient",
      remote: async (client) => {
        const { data, error } = await client
          .from("imported_encounters")
          .select("*")
          .eq("patient_id", patientId)
          .order("encounter_date", { ascending: false });

        requireSuccessfulQuery("ImportedEncounterRepository.listByPatient", error);
        return (data ?? []).map((row) =>
          importedEncounterFromRow(row as unknown as Record<string, unknown>),
        );
      },
      fallback: () =>
        structuredClone(
          fallbackStore.importedEncounters.filter(
            (encounter) => encounter.patientId === patientId,
          ),
        ),
    });
  }

  async findBySourceReference(
    sourceReference: string,
  ): Promise<ImportedEncounter | null> {
    return withRepositoryFallback({
      scope: "ImportedEncounterRepository.findBySourceReference",
      remote: async (client) => {
        const { data, error } = await client
          .from("imported_encounters")
          .select("*")
          .eq("source_reference", sourceReference)
          .maybeSingle();

        requireSuccessfulQuery(
          "ImportedEncounterRepository.findBySourceReference",
          error,
        );
        return data
          ? importedEncounterFromRow(data as unknown as Record<string, unknown>)
          : null;
      },
      fallback: () => {
        const encounter = fallbackStore.importedEncounters.find(
          (candidate) => candidate.sourceReference === sourceReference,
        );
        return encounter ? structuredClone(encounter) : null;
      },
    });
  }

  async save(encounter: ImportedEncounter): Promise<ImportedEncounter> {
    return withRepositoryFallback({
      scope: "ImportedEncounterRepository.save",
      remote: async (client) => {
        const { data, error } = await client
          .from("imported_encounters")
          .upsert(importedEncounterToRow(encounter), {
            onConflict: "source_reference",
          })
          .select("*")
          .single();

        requireSuccessfulQuery("ImportedEncounterRepository.save", error);
        return importedEncounterFromRow(
          data as unknown as Record<string, unknown>,
        );
      },
      fallback: () => {
        const index = fallbackStore.importedEncounters.findIndex(
          (candidate) => candidate.sourceReference === encounter.sourceReference,
        );
        if (index >= 0)
          fallbackStore.importedEncounters[index] = structuredClone(encounter);
        else fallbackStore.importedEncounters.push(structuredClone(encounter));
        return structuredClone(encounter);
      },
    });
  }
}

export const importedEncounterRepository = new ImportedEncounterRepository();
