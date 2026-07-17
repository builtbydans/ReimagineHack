import "server-only";

import type {
  AppointmentBrief,
  AppointmentBriefStatus,
} from "@/server/types/domain";

import { fallbackStore } from "@/server/repositories/fallback-store";
import {
  appointmentBriefFromRow,
  appointmentBriefToRow,
} from "@/server/repositories/mappers";
import {
  requireSuccessfulQuery,
  withRepositoryFallback,
} from "@/server/repositories/repository-support";

export class AppointmentBriefRepository {
  async findLatestByPatient(patientId: string): Promise<AppointmentBrief | null> {
    return withRepositoryFallback({
      scope: "AppointmentBriefRepository.findLatestByPatient",
      remote: async (client) => {
        const { data, error } = await client
          .from("appointment_briefs")
          .select("*")
          .eq("patient_id", patientId)
          .order("appointment_date", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        requireSuccessfulQuery(
          "AppointmentBriefRepository.findLatestByPatient",
          error,
        );
        return data
          ? appointmentBriefFromRow(data as unknown as Record<string, unknown>)
          : null;
      },
      fallback: () => {
        const briefs = fallbackStore.appointmentBriefs
          .filter((brief) => brief.patientId === patientId)
          .sort(
            (left, right) => {
              const appointmentDifference =
                Date.parse(right.appointment.date) -
                Date.parse(left.appointment.date);
              return appointmentDifference ||
                Date.parse(right.generatedAt) - Date.parse(left.generatedAt);
            },
          );
        return briefs[0] ? structuredClone(briefs[0]) : null;
      },
    });
  }

  async save(brief: AppointmentBrief): Promise<AppointmentBrief> {
    return withRepositoryFallback({
      scope: "AppointmentBriefRepository.save",
      remote: async (client) => {
        const { data, error } = await client
          .from("appointment_briefs")
          .upsert(appointmentBriefToRow(brief), { onConflict: "id" })
          .select("*")
          .single();

        requireSuccessfulQuery("AppointmentBriefRepository.save", error);
        return appointmentBriefFromRow(
          data as unknown as Record<string, unknown>,
        );
      },
      fallback: () => {
        const index = fallbackStore.appointmentBriefs.findIndex(
          (candidate) => candidate.id === brief.id,
        );
        if (index >= 0)
          fallbackStore.appointmentBriefs[index] = structuredClone(brief);
        else fallbackStore.appointmentBriefs.push(structuredClone(brief));
        return structuredClone(brief);
      },
    });
  }

  async updateStatus(
    patientId: string,
    status: AppointmentBriefStatus,
  ): Promise<AppointmentBrief | null> {
    const brief = await this.findLatestByPatient(patientId);
    if (!brief) return null;

    return this.save({
      ...brief,
      status,
      generatedAt: new Date().toISOString(),
    });
  }
}

export const appointmentBriefRepository = new AppointmentBriefRepository();
