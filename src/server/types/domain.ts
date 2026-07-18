export type TimelineEventType =
  | "patient_text"
  | "patient_voice"
  | "medication_update"
  | "ae_encounter"
  | "gp_review"
  | "specialist_review"
  | "test_result"
  | "referral"
  | "ai_observation";

export type SourceKind =
  | "patient_reported"
  | "imported_clinical_record"
  | "ai_organised";

export type BloodResultStatus =
  | "within_range"
  | "outside_range"
  | "unknown";

export interface BloodResult {
  name: string;
  value: string;
  status: BloodResultStatus;
  referenceRange?: string;
}

export interface ClinicalObservation {
  name: string;
  value: string;
}

export interface EvidenceReference {
  id: string;
  /** The source timeline event containing this evidence. */
  eventId: string;
  /** The AI-organised event this evidence supports, when applicable. */
  observationId?: string;
  sourceKind: SourceKind;
  label: string;
  excerpt: string;
  originalExcerpt?: string;
  translatedExcerpt?: string;
  field?: string;
  recordedAt: string;
  language?: string;
  organisation?: string;
  audioUrl?: string;
  uncertainty?: string;
}

export type ContextAnswerConfidence =
  | "supported"
  | "partial"
  | "insufficient";

export type ContextAnswerSafetyClassification =
  | "patient_context"
  | "clinical_decision_request"
  | "out_of_scope";

export type ContextAnswer = {
  answer: string;
  confidence: ContextAnswerConfidence;
  evidenceIds: string[];
  missingInformation?: string;
  safetyClassification: ContextAnswerSafetyClassification;
};

export interface MedicationDetails {
  medicationName?: string;
  action?: string;
  adherence?: string;
  reportedSideEffects?: string[];
}

export interface EncounterSourceRecord {
  label: string;
  provider: string;
  sourceReference: string;
  synthetic: boolean;
  imported: boolean;
  manuallyEnteredByPatient: boolean;
}

export interface EncounterDetails {
  reason: string;
  summaryPoints: string[];
  observations: ClinicalObservation[];
  bloodResults: BloodResult[];
  clinicianNote: string;
  sourceRecord: EncounterSourceRecord;
  disposition: string;
  followUpAdvice?: string;
  returnAdvice?: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  summary: string;
  recordedAt: string;
  sourceKind: SourceKind;
  organisation?: string;
  location?: string;
  language?: string;
  originalText?: string;
  translatedText?: string;
  audioUrl?: string;
  severity?: number;
  bodyLocations?: string[];
  symptoms?: string[];
  functionalImpacts?: string[];
  medicationDetails?: MedicationDetails;
  observations?: Record<string, string | number>;
  bloodResults?: BloodResult[];
  encounterDetails?: EncounterDetails;
  evidenceRefs?: EvidenceReference[];
  metadata?: Record<string, unknown>;
  structuredData?: Record<string, unknown>;
}

export interface AppointmentDetails {
  title: string;
  organisation: string;
  date: string;
  appointmentType?: string;
  location?: string;
  clinician?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  condition: string;
  preferredLanguage: string;
  avatarUrl?: string;
  nextAppointment?: AppointmentDetails;
}

export interface PatientUpdate {
  id: string;
  patientId: string;
  inputType: "voice" | "text" | "symptom" | "medication";
  originalText: string;
  originalLanguage: string;
  englishTranslation: string | null;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceRecord {
  id: string;
  patientId: string;
  sourceType: string;
  sourceId: string | null;
  title: string;
  originalContent: string;
  translatedContent: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EvidenceSentenceReference {
  id: string;
  sentence: string;
  supports: string[];
}

export interface StructuredPatientUpdate {
  originalText: string;
  translatedText?: string;
  recordedAt: string;
  sourceKind: "patient_reported";
  symptoms: string[];
  severity?: number;
  bodyLocations: string[];
  functionalImpacts: string[];
  medicationDetails?: MedicationDetails;
  medicationNotes?: string[];
  sleepImpact?: string;
  questionsForNextAppointment: string[];
  evidenceSentences: EvidenceSentenceReference[];
}

export type ObservationCategory =
  | "symptom_trend"
  | "sleep"
  | "medication"
  | "functional_impact"
  | "continuity";

export interface ObservationStatement {
  id: string;
  category: ObservationCategory;
  text: string;
  evidenceIds: string[];
  evidenceCount: number;
  sourceEventIds: string[];
  uncertainty?: string;
}

export interface ThreadObservation {
  id: string;
  patientId: string;
  recordedAt: string;
  title: string;
  summary: string;
  evidenceSummary: string;
  badge: "AI-organised";
  clinicalVerificationStatus: "not_clinically_verified";
  statements: ObservationStatement[];
  evidenceIds: string[];
  sourceEventIds: string[];
  evidenceRefs?: EvidenceReference[];
}

export type AppointmentBriefStatus = "draft" | "ready" | "shared";

export type AppointmentBriefSectionKey =
  | "main_concern"
  | "changes_since_last_review"
  | "medication"
  | "relevant_encounter"
  | "patient_priorities"
  | "patient_questions";

export interface AppointmentBriefItem {
  id: string;
  text: string;
  evidenceIds: string[];
  evidenceCount: number;
}

export interface AppointmentBriefSection {
  id: string;
  key: AppointmentBriefSectionKey;
  title: string;
  items: AppointmentBriefItem[];
}

export interface AppointmentBrief {
  id: string;
  patientId: string;
  appointment: AppointmentDetails;
  status: AppointmentBriefStatus;
  generatedAt: string;
  patientPriorities: string[];
  additionalContext?: string;
  sections: AppointmentBriefSection[];
  reviewNotice: string;
  evidenceIds: string[];
  evidenceRefs?: EvidenceReference[];
}

export type EncounterImportStatus =
  | "available"
  | "importing"
  | "imported"
  | "failed";

export interface ImportedEncounter {
  id: string;
  patientId: string;
  timelineEventId: string;
  provider: string;
  encounterType: string;
  encounterDate: string;
  sourceReference: string;
  sourceLabel: string;
  status: EncounterImportStatus;
  synthetic: true;
  rawPayload: Record<string, unknown>;
  structuredData: EncounterDetails;
}

export interface ClinicianContext {
  patient: Patient;
  timelineEvents: TimelineEvent[];
  evidence: EvidenceReference[];
  appointmentBrief: AppointmentBrief;
  importedEncounters: ImportedEncounter[];
  observation: ThreadObservation;
  dataSource: "supabase" | "fallback";
}

export interface EncounterImportStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "failed";
}

export interface EncounterImportResult {
  success: boolean;
  status: "imported" | "already_imported" | "failed";
  message: string;
  encounter?: ImportedEncounter;
  timelineEvent?: TimelineEvent;
  steps?: EncounterImportStep[];
}
