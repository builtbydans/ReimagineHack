import "server-only";

import { demoPatient } from "@/data/seed";
import type { Patient } from "@/server/types/domain";

import { mapPatient } from "@/server/repositories/mappers";
import {
  RepositoryError,
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

export class PatientRepository {
  async findById(patientId: string): Promise<Patient | null> {
    return withRepositoryFallback({
      scope: "PatientRepository.findById",
      remote: async (client) => {
        const { data, error } = await client
          .from("patients")
          .select(
            "id, full_name, date_of_birth, primary_condition, preferred_language, created_at, updated_at",
          )
          .eq("id", patientId)
          .maybeSingle();

        requireSuccessfulQuery("PatientRepository.findById", error);
        if (!data) {
          throw new RepositoryError(
            "PatientRepository",
            `Patient ${patientId} was not found.`,
          );
        }
        return mapPatient(data);
      },
      fallback: () =>
        patientId === demoPatient.id ? structuredClone(demoPatient) : null,
    });
  }
}

export const patientRepository = new PatientRepository();
