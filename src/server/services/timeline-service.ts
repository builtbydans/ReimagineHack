import "server-only";

import type { PatientUpdateInput, ReviewedPatientEventInput } from "@/server/schemas";
import type {
  EvidenceReference,
  StructuredPatientUpdate,
  TimelineEvent,
} from "@/server/types/domain";

import { evidenceRepository } from "@/server/repositories/evidence-repository";
import { patientRepository } from "@/server/repositories/patient-repository";
import { timelineRepository } from "@/server/repositories/timeline-repository";
import { createHealthExtractionService } from "@/server/services/ai-extraction-service";
import { DomainServiceError } from "@/server/services/service-error";

const summaryFrom = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= 220 ? clean : `${clean.slice(0, 217)}…`;
};

export type OrganisedPatientUpdate = {
  structuredUpdate: StructuredPatientUpdate;
  event: TimelineEvent;
  saved: boolean;
};

export class TimelineService {
  async getTimeline(patientId: string): Promise<TimelineEvent[]> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }
    return timelineRepository.listByPatient(patientId);
  }

  async getEvidence(observationId: string): Promise<EvidenceReference[]> {
    return evidenceRepository.listForObservation(observationId);
  }

  async organisePatientUpdate(
    input: PatientUpdateInput,
  ): Promise<OrganisedPatientUpdate> {
    const patient = await patientRepository.findById(input.patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }

    const recordedAt = input.recordedAt ?? new Date().toISOString();
    const structuredUpdate =
      await createHealthExtractionService().extractPatientUpdate({
        originalText: input.originalText,
        translatedText: input.translatedText,
        recordedAt,
      });
    const event: TimelineEvent = {
      id: crypto.randomUUID(),
      patientId: input.patientId,
      type: input.sourceType === "voice" ? "patient_voice" : "patient_text",
      title:
        input.sourceType === "voice" ? "Voice update" : "Written update",
      summary: summaryFrom(input.translatedText ?? input.originalText),
      recordedAt,
      sourceKind: "patient_reported",
      ...(input.language ? { language: input.language } : {}),
      originalText: input.originalText,
      ...(input.translatedText ? { translatedText: input.translatedText } : {}),
      ...(input.audioUrl ? { audioUrl: input.audioUrl } : {}),
      ...(input.severity === undefined && structuredUpdate.severity === undefined
        ? {}
        : { severity: input.severity ?? structuredUpdate.severity }),
      bodyLocations: structuredUpdate.bodyLocations,
      symptoms: structuredUpdate.symptoms,
      functionalImpacts: structuredUpdate.functionalImpacts,
      ...(structuredUpdate.medicationDetails
        ? { medicationDetails: structuredUpdate.medicationDetails }
        : {}),
      metadata: {
        categories: input.categories,
        structuredUpdate,
        organisedBy: "Thread",
        clinicalVerificationStatus: "not_clinically_verified",
      },
    };

    if (!input.save) return { structuredUpdate, event, saved: false };

    return {
      structuredUpdate,
      event: await timelineRepository.save(event),
      saved: true,
    };
  }

  async saveReviewedPatientEvent(
    event: ReviewedPatientEventInput,
  ): Promise<TimelineEvent> {
    const patient = await patientRepository.findById(event.patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }

    // The route schema limits this write to patient-reported text/voice events.
    // Persist the reviewed object verbatim so extraction cannot change between
    // the review screen and the final save action.
    return timelineRepository.save(event as TimelineEvent);
  }
}

export const timelineService = new TimelineService();
