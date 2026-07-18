import "server-only";

import { appointmentBriefRepository } from "@/server/repositories/appointment-brief-repository";
import { importedEncounterRepository } from "@/server/repositories/imported-encounter-repository";
import { patientRepository } from "@/server/repositories/patient-repository";
import { timelineRepository } from "@/server/repositories/timeline-repository";
import type {
  AiEvidenceItem,
  AiEvidenceSourceType,
  ClinicalContext,
  EvidenceReference,
  TimelineEvent,
} from "@/server/types/domain";

const MAX_TEXT_LENGTH = 4_000;

const boundedText = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_TEXT_LENGTH);
};

const sourceTypeFor = (
  event: TimelineEvent,
  reference?: EvidenceReference,
): AiEvidenceSourceType => {
  if (reference && event.type === "patient_voice") return "voice_transcript";
  if (event.type === "patient_voice") return "patient_voice";
  if (event.type === "patient_text") return "patient_text";
  if (event.type === "medication_update") return "medication_update";
  if (event.type === "referral") return "referral";
  if (["ae_encounter", "gp_review", "specialist_review", "test_result"].includes(event.type)) {
    return "clinical_encounter";
  }
  return "other";
};

const evidenceMetadata = (event: TimelineEvent): Record<string, unknown> => ({
  sourceKind: event.sourceKind,
  ...(event.language ? { language: event.language } : {}),
  ...(typeof event.severity === "number" ? { severity: event.severity } : {}),
  ...(event.symptoms?.length ? { symptoms: event.symptoms.slice(0, 20) } : {}),
  ...(event.bodyLocations?.length
    ? { bodyLocations: event.bodyLocations.slice(0, 20) }
    : {}),
  ...(event.functionalImpacts?.length
    ? { functionalImpacts: event.functionalImpacts.slice(0, 20) }
    : {}),
  ...(event.medicationDetails
    ? { medicationDetails: event.medicationDetails }
    : {}),
  ...(event.observations ? { observations: event.observations } : {}),
  ...(event.bloodResults?.length
    ? { bloodResults: event.bloodResults.slice(0, 20) }
    : {}),
  ...(event.encounterDetails
    ? {
        encounter: {
          reason: event.encounterDetails.reason,
          summaryPoints: event.encounterDetails.summaryPoints.slice(0, 12),
          observations: event.encounterDetails.observations.slice(0, 20),
          bloodResults: event.encounterDetails.bloodResults.slice(0, 20),
          disposition: event.encounterDetails.disposition,
          followUpAdvice: event.encounterDetails.followUpAdvice ?? null,
        },
      }
    : {}),
});

const evidenceFromEvent = (event: TimelineEvent): AiEvidenceItem[] => {
  if (event.type === "ai_observation") return [];
  const references = event.evidenceRefs ?? [];
  if (!references.length) {
    return [
      {
        id: event.id,
        sourceType: sourceTypeFor(event),
        title: event.title,
        occurredAt: event.recordedAt,
        originalText: boundedText(event.originalText),
        translatedText: boundedText(event.translatedText),
        summary: boundedText(event.summary),
        organisation: event.organisation ?? null,
        metadata: evidenceMetadata(event),
      },
    ];
  }

  return references.map((reference) => ({
    id: reference.id,
    sourceType: sourceTypeFor(event, reference),
    title: reference.label,
    occurredAt: reference.recordedAt,
    originalText: boundedText(reference.originalExcerpt ?? event.originalText),
    translatedText: boundedText(
      reference.translatedExcerpt ?? event.translatedText,
    ),
    summary: boundedText(reference.excerpt ?? event.summary),
    organisation: reference.organisation ?? event.organisation ?? null,
    metadata: {
      ...evidenceMetadata(event),
      eventId: event.id,
      ...(reference.field ? { field: reference.field } : {}),
      ...(reference.uncertainty
        ? { uncertainty: reference.uncertainty }
        : {}),
    },
  }));
};

export const evidenceReferenceFromAiItem = (
  item: AiEvidenceItem,
): EvidenceReference => {
  const isClinical = ["clinical_encounter", "referral"].includes(
    item.sourceType,
  );
  const excerpt =
    item.translatedText ?? item.summary ?? item.originalText ?? "Recorded evidence";
  const language = item.metadata.language;
  const eventId = item.metadata.eventId;
  return {
    id: item.id,
    eventId: typeof eventId === "string" ? eventId : item.id,
    sourceKind: isClinical
      ? "imported_clinical_record"
      : "patient_reported",
    label: item.title,
    excerpt,
    ...(item.originalText ? { originalExcerpt: item.originalText } : {}),
    ...(item.translatedText
      ? { translatedExcerpt: item.translatedText }
      : {}),
    recordedAt: item.occurredAt,
    ...(typeof language === "string" ? { language } : {}),
    ...(item.organisation ? { organisation: item.organisation } : {}),
  };
};

export class ClinicalContextService {
  async load(patientId: string): Promise<ClinicalContext> {
    const [patient, events, appointmentBrief, importedEncounters] =
      await Promise.all([
        patientRepository.findById(patientId),
        timelineRepository.listByPatient(patientId),
        appointmentBriefRepository.findLatestByPatient(patientId),
        importedEncounterRepository.listByPatient(patientId),
      ]);

    if (!patient) throw new Error("Patient record was not found.");

    const evidenceById = new Map<string, AiEvidenceItem>();
    for (const event of events) {
      for (const item of evidenceFromEvent(event)) {
        if (!evidenceById.has(item.id)) evidenceById.set(item.id, item);
      }
    }

    for (const encounter of importedEncounters) {
      if (evidenceById.has(encounter.id)) continue;
      evidenceById.set(encounter.id, {
        id: encounter.id,
        sourceType: "clinical_encounter",
        title: encounter.structuredData.reason,
        occurredAt: encounter.encounterDate,
        originalText: null,
        translatedText: null,
        summary: boundedText(encounter.structuredData.summaryPoints.join(" ")),
        organisation: encounter.provider,
        metadata: {
          encounterType: encounter.encounterType,
          disposition: encounter.structuredData.disposition,
          observations: encounter.structuredData.observations.slice(0, 20),
          bloodResults: encounter.structuredData.bloodResults.slice(0, 20),
          followUpAdvice: encounter.structuredData.followUpAdvice ?? null,
        },
      });
    }

    const evidence = [...evidenceById.values()].sort(
      (left, right) =>
        Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
    );
    const lastGpEncounter = events.find((event) => event.type === "gp_review");
    const appointment = patient.nextAppointment ?? appointmentBrief?.appointment;

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth ?? null,
        age: Number.isFinite(patient.age) ? patient.age : null,
        condition: patient.condition ?? null,
        preferredLanguage: patient.preferredLanguage ?? null,
      },
      lastGpEncounterAt: lastGpEncounter?.recordedAt ?? null,
      upcomingAppointment: appointment
        ? {
            title: appointment.title,
            organisation: appointment.organisation ?? null,
            appointmentAt: appointment.date,
          }
        : null,
      evidence,
    };
  }
}

export const clinicalContextService = new ClinicalContextService();
