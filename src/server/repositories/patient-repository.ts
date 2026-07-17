import "server-only";

import { demoPatient } from "@/data/seed";
import type { Patient } from "@/server/types/domain";

import { patientFromRow } from "@/server/repositories/mappers";
import {
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
          .select("*")
          .eq("id", patientId)
          .maybeSingle();

        requireSuccessfulQuery("PatientRepository.findById", error);
        return data
          ? patientFromRow(data as unknown as Record<string, unknown>)
          : null;
      },
      fallback: () =>
        patientId === demoPatient.id ? structuredClone(demoPatient) : null,
    });
  }
}

export const patientRepository = new PatientRepository();

