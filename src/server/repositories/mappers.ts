import "server-only";

import { demoPatient } from "@/data/seed";
import type {
  AppointmentBrief,
  AppointmentBriefSection,
  EncounterDetails,
  EvidenceRecord,
  EvidenceReference,
  ImportedEncounter,
  Patient,
  PatientUpdate,
  TimelineEvent,
} from "@/server/types/domain";

type JsonObject = Record<string, unknown>;

const objectValue = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : [];

const humaniseKey = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (value) => value.toUpperCase());

const encounterDetailsFromStructured = (
  row: JsonObject,
  structured: JsonObject,
): EncounterDetails | undefined => {
  if (structured.encounterDetails) {
    return structured.encounterDetails as EncounterDetails;
  }
  if (!structured.reason && !structured.bloodResults && !structured.clinicianNote) {
    return undefined;
  }

  const metadata = objectValue(structured.metadata);
  const sourceRecord = objectValue(structured.sourceRecord);
  const observationsValue = structured.observations;
  const observations = Array.isArray(observationsValue)
    ? observationsValue as EncounterDetails["observations"]
    : Object.entries(objectValue(observationsValue)).map(([name, value]) => ({
        name: humaniseKey(name),
        value: String(value),
      }));
  const summaryPoints = stringArray(structured.summary);
  if (!summaryPoints.length && row.summary) summaryPoints.push(String(row.summary));
  summaryPoints.push(...stringArray(structured.interventions));
  if (structured.disposition) summaryPoints.push(String(structured.disposition));
  if (structured.followUp) summaryPoints.push(String(structured.followUp));

  return {
    reason: String(structured.reason ?? row.summary ?? "Imported encounter"),
    summaryPoints,
    observations,
    bloodResults: Array.isArray(structured.bloodResults)
      ? structured.bloodResults as EncounterDetails["bloodResults"]
      : [],
    clinicianNote: String(structured.clinicianNote ?? row.summary ?? ""),
    sourceRecord: {
      label: String(
        sourceRecord.label ?? metadata.source ?? "Synthetic imported encounter record",
      ),
      provider: String(row.provider ?? row.organisation ?? "Imported provider"),
      sourceReference: String(
        sourceRecord.sourceReference
          ?? sourceRecord.reference
          ?? metadata.recordId
          ?? row.source_reference
          ?? "SYNTHETIC-DEMO-RECORD",
      ),
      synthetic: sourceRecord.synthetic !== false,
      imported: sourceRecord.imported !== false,
      manuallyEnteredByPatient: Boolean(
        sourceRecord.manuallyEnteredByPatient ?? sourceRecord.enteredByPatient ?? metadata.enteredByPatient,
      ),
    },
    disposition: String(structured.disposition ?? "Imported record disposition not provided"),
    ...(structured.followUp
      ? { followUpAdvice: String(structured.followUp) }
      : {}),
    ...(structured.returnAdvice
      ? { returnAdvice: String(structured.returnAdvice) }
      : {}),
  };
};

export const patientFromRow = (row: JsonObject): Patient => ({
  id: String(row.id),
  name: String(row.name),
  dateOfBirth: String(row.date_of_birth ?? ""),
  age:
    typeof row.age === "number"
      ? row.age
      : demoPatient.id === row.id
        ? demoPatient.age
        : 0,
  condition: String(row.condition ?? ""),
  preferredLanguage: String(row.preferred_language ?? "English"),
  ...(row.avatar_url ? { avatarUrl: String(row.avatar_url) } : {}),
  ...(demoPatient.id === row.id && demoPatient.nextAppointment
    ? { nextAppointment: demoPatient.nextAppointment }
    : {}),
});

export const patientUpdateFromRow = (row: JsonObject): PatientUpdate => ({
  id: String(row.id),
  patientId: String(row.patient_id),
  inputType: row.input_type as PatientUpdate["inputType"],
  originalText: String(row.original_text),
  originalLanguage: String(row.original_language),
  englishTranslation:
    row.english_translation == null ? null : String(row.english_translation),
  processingStatus:
    row.processing_status as PatientUpdate["processingStatus"],
  processingError:
    row.processing_error == null ? null : String(row.processing_error),
  occurredAt: String(row.occurred_at),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

export const evidenceRecordFromRow = (row: JsonObject): EvidenceRecord => ({
  id: String(row.id),
  patientId: String(row.patient_id),
  sourceType: String(row.source_type),
  sourceId: row.source_id == null ? null : String(row.source_id),
  title: String(row.title),
  originalContent: String(row.original_content),
  translatedContent:
    row.translated_content == null ? null : String(row.translated_content),
  occurredAt: String(row.occurred_at),
  metadata: objectValue(row.metadata),
  createdAt: String(row.created_at),
});

export const evidenceFromRow = (row: JsonObject): EvidenceReference => ({
  id: String(row.id),
  eventId: String(row.supporting_event_id ?? row.event_id),
  ...(row.event_id ? { observationId: String(row.event_id) } : {}),
  sourceKind: row.source_kind as EvidenceReference["sourceKind"],
  label: String(row.label ?? "Supporting evidence"),
  excerpt: String(row.excerpt ?? ""),
  ...(row.original_excerpt
    ? { originalExcerpt: String(row.original_excerpt) }
    : {}),
  ...(row.translated_excerpt
    ? { translatedExcerpt: String(row.translated_excerpt) }
    : {}),
  ...(row.field ? { field: String(row.field) } : {}),
  recordedAt: String(row.recorded_at ?? row.created_at),
});

export const timelineEventFromRow = (
  row: JsonObject,
  evidenceRefs: EvidenceReference[] = [],
): TimelineEvent => {
  const structured = objectValue(row.structured_data);
  const encounterDetails = encounterDetailsFromStructured(row, structured);

  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    type: row.event_type as TimelineEvent["type"],
    title: String(row.title),
    summary: String(row.summary ?? ""),
    recordedAt: String(row.recorded_at),
    sourceKind: row.source_kind as TimelineEvent["sourceKind"],
    ...(row.organisation ? { organisation: String(row.organisation) } : {}),
    ...(row.location ? { location: String(row.location) } : {}),
    ...(row.language ? { language: String(row.language) } : {}),
    ...(row.original_text ? { originalText: String(row.original_text) } : {}),
    ...(row.translated_text
      ? { translatedText: String(row.translated_text) }
      : {}),
    ...(row.audio_url ? { audioUrl: String(row.audio_url) } : {}),
    ...(typeof row.severity === "number" ? { severity: row.severity } : {}),
    ...(Array.isArray(structured.bodyLocations)
      ? { bodyLocations: structured.bodyLocations as string[] }
      : {}),
    ...(Array.isArray(structured.symptoms)
      ? { symptoms: structured.symptoms as string[] }
      : {}),
    ...(Array.isArray(structured.functionalImpacts)
      ? { functionalImpacts: structured.functionalImpacts as string[] }
      : {}),
    ...(structured.medicationDetails
      ? {
          medicationDetails:
            structured.medicationDetails as TimelineEvent["medicationDetails"],
        }
      : {}),
    ...(structured.observations
      ? {
          observations:
            structured.observations as TimelineEvent["observations"],
        }
      : {}),
    ...(Array.isArray(structured.bloodResults)
      ? {
          bloodResults:
            structured.bloodResults as TimelineEvent["bloodResults"],
        }
      : {}),
    ...(encounterDetails ? { encounterDetails } : {}),
    ...(structured.metadata
      ? { metadata: structured.metadata as Record<string, unknown> }
      : {}),
    ...(evidenceRefs.length ? { evidenceRefs } : {}),
  };
};

export const timelineEventToRow = (event: TimelineEvent) => ({
  id: event.id,
  patient_id: event.patientId,
  event_type: event.type,
  title: event.title,
  summary: event.summary,
  recorded_at: event.recordedAt,
  source_kind: event.sourceKind,
  organisation: event.organisation ?? null,
  location: event.location ?? null,
  language: event.language ?? null,
  original_text: event.originalText ?? null,
  translated_text: event.translatedText ?? null,
  audio_url: event.audioUrl ?? null,
  severity: event.severity ?? null,
  structured_data: {
    bodyLocations: event.bodyLocations ?? [],
    symptoms: event.symptoms ?? [],
    functionalImpacts: event.functionalImpacts ?? [],
    ...(event.medicationDetails
      ? { medicationDetails: event.medicationDetails }
      : {}),
    ...(event.observations ? { observations: event.observations } : {}),
    ...(event.bloodResults ? { bloodResults: event.bloodResults } : {}),
    ...(event.encounterDetails
      ? { encounterDetails: event.encounterDetails }
      : {}),
    ...(event.metadata ? { metadata: event.metadata } : {}),
  },
});

export const appointmentBriefFromRow = (row: JsonObject): AppointmentBrief => {
  const summary = objectValue(row.summary);
  const legacySectionDefinitions: Array<{
    key: AppointmentBriefSection["key"];
    title: string;
    value: unknown;
  }> = [
    { key: "main_concern", title: "Main concern", value: summary.mainConcern },
    { key: "changes_since_last_review", title: "Changes since last review", value: summary.changesSinceLastReview },
    { key: "medication", title: "Medication", value: summary.medication },
    { key: "relevant_encounter", title: "Relevant encounter", value: summary.relevantEncounter },
    { key: "patient_priorities", title: "Patient priorities", value: summary.patientPriorities },
    { key: "patient_questions", title: "Patient questions", value: summary.patientQuestions },
  ];
  const legacySections: AppointmentBriefSection[] = legacySectionDefinitions
    .map((definition) => {
      const values = Array.isArray(definition.value)
        ? definition.value
        : definition.value
          ? [definition.value]
          : [];
      return {
        id: `${String(row.id)}-${definition.key}`,
        key: definition.key,
        title: definition.title,
        items: values.map((value, index) => {
          const item = objectValue(value);
          const evidenceIds = stringArray(item.evidenceIds ?? item.evidenceReferenceIds);
          return {
            id: `${String(row.id)}-${definition.key}-${index + 1}`,
            text: String(item.text ?? value),
            evidenceIds,
            evidenceCount: evidenceIds.length,
          };
        }),
      };
    })
    .filter((section) => section.items.length > 0);
  const sections = Array.isArray(summary.sections)
    ? summary.sections as AppointmentBrief["sections"]
    : legacySections;
  const rawPriorities = Array.isArray(row.patient_priorities)
    ? row.patient_priorities
    : [];
  const patientPriorities = rawPriorities
    .map((value) => {
      if (typeof value === "string") return value;
      const priority = objectValue(value);
      return priority.selected === false ? "" : String(priority.label ?? "");
    })
    .filter(Boolean);
  const evidenceIds = Array.isArray(summary.evidenceIds)
    ? summary.evidenceIds as string[]
    : [...new Set(sections.flatMap((section) => section.items.flatMap((item) => item.evidenceIds)))];

  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    appointment: (summary.appointment as AppointmentBrief["appointment"] | undefined)
      ?? demoPatient.nextAppointment
      ?? {
        title: "Appointment",
        organisation: "Healthcare provider",
        date: String(row.appointment_date),
      },
    status: row.status as AppointmentBrief["status"],
    generatedAt: String(row.updated_at ?? row.created_at),
    patientPriorities,
    ...(summary.additionalContext
      ? { additionalContext: String(summary.additionalContext) }
      : {}),
    sections,
    reviewNotice: String(
      summary.reviewNotice ?? summary.disclaimer ?? "Review this brief before sharing.",
    ),
    evidenceIds,
    ...(Array.isArray(summary.evidenceRefs)
      ? { evidenceRefs: summary.evidenceRefs as EvidenceReference[] }
      : {}),
  };
};

export const appointmentBriefToRow = (brief: AppointmentBrief) => ({
  id: brief.id,
  patient_id: brief.patientId,
  appointment_date: brief.appointment.date,
  status: brief.status,
  patient_priorities: brief.patientPriorities,
  summary: {
    appointment: brief.appointment,
    ...(brief.additionalContext
      ? { additionalContext: brief.additionalContext }
      : {}),
    sections: brief.sections,
    reviewNotice: brief.reviewNotice,
    evidenceIds: brief.evidenceIds,
    ...(brief.evidenceRefs ? { evidenceRefs: brief.evidenceRefs } : {}),
  },
  updated_at: brief.generatedAt,
});

export const importedEncounterFromRow = (row: JsonObject): ImportedEncounter => {
  const structured = objectValue(row.structured_data);
  const encounterDetails = encounterDetailsFromStructured(row, structured);
  const sourceRecord = objectValue(structured.sourceRecord);
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    timelineEventId: String(row.timeline_event_id),
    provider: String(row.provider),
    encounterType: String(row.encounter_type),
    encounterDate: String(row.encounter_date),
    sourceReference: String(row.source_reference),
    sourceLabel: String(
      structured.sourceLabel ?? sourceRecord.label ?? "Imported clinical record",
    ),
    status: "imported",
    synthetic: true,
    rawPayload: objectValue(row.raw_payload),
    structuredData: encounterDetails ?? structured as unknown as ImportedEncounter["structuredData"],
  };
};

export const importedEncounterToRow = (encounter: ImportedEncounter) => ({
  id: encounter.id,
  patient_id: encounter.patientId,
  timeline_event_id: encounter.timelineEventId,
  provider: encounter.provider,
  encounter_type: encounter.encounterType,
  encounter_date: encounter.encounterDate,
  source_reference: encounter.sourceReference,
  raw_payload: encounter.rawPayload,
  structured_data: {
    sourceLabel: encounter.sourceLabel,
    encounterDetails: encounter.structuredData,
  },
});
