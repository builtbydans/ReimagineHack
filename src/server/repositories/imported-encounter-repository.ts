import "server-only";

import type { ImportedEncounter } from "@/server/types/domain";

import { fallbackStore } from "@/server/repositories/fallback-store";
import {
  clinicalEncounterInsertFromImportedEncounter,
  mapImportedEncounter,
} from "@/server/repositories/mappers";
import {
  RepositoryError,
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

export class ImportedEncounterRepository {
  async listByPatient(patientId: string): Promise<ImportedEncounter[]> {
    return withRepositoryFallback({
      scope: "ImportedEncounterRepository.listByPatient",
      remote: async (client) => {
        const { data, error } = await client
          .from("clinical_encounters")
          .select(
            "id, patient_id, encounter_type, organisation, title, summary, raw_record, occurred_at, created_at, updated_at",
          )
          .eq("patient_id", patientId)
          .order("occurred_at", { ascending: false });

        requireSuccessfulQuery("ImportedEncounterRepository.listByPatient", error);
        return (data ?? []).map(mapImportedEncounter);
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
          .from("clinical_encounters")
          .select(
            "id, patient_id, encounter_type, organisation, title, summary, raw_record, occurred_at, created_at, updated_at",
          )
          .order("occurred_at", { ascending: false });

        requireSuccessfulQuery(
          "ImportedEncounterRepository.findBySourceReference",
          error,
        );
        const encounter = (data ?? [])
          .map(mapImportedEncounter)
          .find((candidate) => candidate.sourceReference === sourceReference);
        return encounter ?? null;
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
          .from("clinical_encounters")
          .upsert(clinicalEncounterInsertFromImportedEncounter(encounter), {
            onConflict: "id",
          })
          .select(
            "id, patient_id, encounter_type, organisation, title, summary, raw_record, occurred_at, created_at, updated_at",
          )
          .single();

        requireSuccessfulQuery("ImportedEncounterRepository.save", error);
        if (!data) {
          throw new RepositoryError(
            "ImportedEncounterRepository.save",
            "Supabase returned no clinical encounter row.",
          );
        }
        return mapImportedEncounter(data);
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
