import "server-only";

import type {
  AppointmentBrief,
  AppointmentBriefStatus,
} from "@/server/types/domain";

import { appointmentBriefRepository } from "@/server/repositories/appointment-brief-repository";
import { patientRepository } from "@/server/repositories/patient-repository";
import { timelineRepository } from "@/server/repositories/timeline-repository";
import { createHealthExtractionService } from "@/server/services/ai-extraction-service";
import { DomainServiceError } from "@/server/services/service-error";

export class AppointmentBriefService {
  async getLatest(patientId: string): Promise<AppointmentBrief | null> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }
    return appointmentBriefRepository.findLatestByPatient(patientId);
  }

  async generate(input: {
    patientId: string;
    priorities: string[];
    additionalContext?: string;
  }): Promise<AppointmentBrief> {
    const patient = await patientRepository.findById(input.patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }
    if (!patient.nextAppointment) {
      throw new DomainServiceError(
        409,
        "NO_UPCOMING_APPOINTMENT",
        "No upcoming appointment is available for this brief.",
      );
    }

    const events = await timelineRepository.listByPatient(input.patientId);
    const brief =
      await createHealthExtractionService().generateAppointmentBrief({
        patient,
        events,
        priorities: input.priorities,
      });

    return appointmentBriefRepository.save({
      ...brief,
      ...(input.additionalContext?.trim()
        ? { additionalContext: input.additionalContext.trim() }
        : {}),
    });
  }

  async setStatus(
    patientId: string,
    status: AppointmentBriefStatus,
  ): Promise<AppointmentBrief> {
    const brief = await appointmentBriefRepository.updateStatus(patientId, status);
    if (!brief) {
      throw new DomainServiceError(
        404,
        "BRIEF_NOT_FOUND",
        "Generate an appointment brief before changing its status.",
      );
    }
    return brief;
  }
}

export const appointmentBriefService = new AppointmentBriefService();
