import {
  EVIDENCE_IDS,
  THREAD_OBSERVATION_ID,
  TIMELINE_EVENT_IDS,
} from "@/data/seed/ids";
import { demoPatient } from "@/data/seed/patient";
import type { ThreadObservation } from "@/server/types/domain";

const notVerified =
  "Thread organised this from the linked records. It has not been clinically verified.";

export const seedThreadObservation: ThreadObservation = {
  id: THREAD_OBSERVATION_ID,
  patientId: demoPatient.id,
  recordedAt: "2026-07-17T14:00:00+01:00",
  title: "What Thread has noticed",
  summary:
    "Your recorded pelvic pain has increased across the last three cycles. Sleep and work have also been affected more often.",
  evidenceSummary: "Based on 5 updates and 2 encounters.",
  badge: "AI-organised",
  clinicalVerificationStatus: "not_clinically_verified",
  statements: [
    {
      id: "60000000-0000-4000-8000-000000000001",
      category: "symptom_trend",
      text: "Pain increased across the last three recorded cycles.",
      evidenceIds: [
        EVIDENCE_IDS.mayPain,
        EVIDENCE_IDS.voicePain,
        EVIDENCE_IDS.julyPainAndSleep,
      ],
      evidenceCount: 3,
      sourceEventIds: [
        TIMELINE_EVENT_IDS.mayTextUpdate,
        TIMELINE_EVENT_IDS.juneUrduVoiceUpdate,
        TIMELINE_EVENT_IDS.julyVoiceUpdate,
      ],
      uncertainty: notVerified,
    },
    {
      id: "60000000-0000-4000-8000-000000000002",
      category: "sleep",
      text: "Sleep disruption is now appearing in recent updates.",
      evidenceIds: [EVIDENCE_IDS.juneSleep, EVIDENCE_IDS.julyPainAndSleep],
      evidenceCount: 2,
      sourceEventIds: [
        TIMELINE_EVENT_IDS.juneTextUpdate,
        TIMELINE_EVENT_IDS.julyVoiceUpdate,
      ],
      uncertainty: notVerified,
    },
    {
      id: "60000000-0000-4000-8000-000000000003",
      category: "medication",
      text: "Medication use became inconsistent because of reported nausea.",
      evidenceIds: [
        EVIDENCE_IDS.medicationNausea,
        EVIDENCE_IDS.medicationUncertainty,
        EVIDENCE_IDS.avoidedMedication,
      ],
      evidenceCount: 3,
      sourceEventIds: [
        TIMELINE_EVENT_IDS.juneMedicationUpdate,
        TIMELINE_EVENT_IDS.julyVoiceUpdate,
      ],
      uncertainty: notVerified,
    },
    {
      id: "60000000-0000-4000-8000-000000000004",
      category: "functional_impact",
      text: "Work has been affected on two recorded occasions.",
      evidenceIds: [
        EVIDENCE_IDS.voiceWork,
        EVIDENCE_IDS.secondEarlyDeparture,
      ],
      evidenceCount: 2,
      sourceEventIds: [
        TIMELINE_EVENT_IDS.juneUrduVoiceUpdate,
        TIMELINE_EVENT_IDS.juneWorkUpdate,
      ],
      uncertainty: notVerified,
    },
    {
      id: "60000000-0000-4000-8000-000000000005",
      category: "continuity",
      text: "Symptoms continued after the A&E attendance.",
      evidenceIds: [
        EVIDENCE_IDS.emergencyReason,
        EVIDENCE_IDS.postEmergencySymptoms,
        EVIDENCE_IDS.gpTracking,
        EVIDENCE_IDS.voicePain,
      ],
      evidenceCount: 4,
      sourceEventIds: [
        TIMELINE_EVENT_IDS.uclhEmergencyEncounter,
        TIMELINE_EVENT_IDS.postEmergencyUpdate,
        TIMELINE_EVENT_IDS.juneGpReview,
        TIMELINE_EVENT_IDS.juneUrduVoiceUpdate,
      ],
      uncertainty: notVerified,
    },
  ],
  evidenceIds: [
    EVIDENCE_IDS.mayPain,
    EVIDENCE_IDS.emergencyReason,
    EVIDENCE_IDS.postEmergencySymptoms,
    EVIDENCE_IDS.gpTracking,
    EVIDENCE_IDS.voicePain,
    EVIDENCE_IDS.voiceWork,
    EVIDENCE_IDS.medicationNausea,
    EVIDENCE_IDS.medicationUncertainty,
    EVIDENCE_IDS.juneSleep,
    EVIDENCE_IDS.secondEarlyDeparture,
    EVIDENCE_IDS.julyPainAndSleep,
    EVIDENCE_IDS.avoidedMedication,
  ],
  sourceEventIds: [
    TIMELINE_EVENT_IDS.mayTextUpdate,
    TIMELINE_EVENT_IDS.uclhEmergencyEncounter,
    TIMELINE_EVENT_IDS.postEmergencyUpdate,
    TIMELINE_EVENT_IDS.juneGpReview,
    TIMELINE_EVENT_IDS.juneUrduVoiceUpdate,
    TIMELINE_EVENT_IDS.juneMedicationUpdate,
    TIMELINE_EVENT_IDS.juneTextUpdate,
    TIMELINE_EVENT_IDS.juneWorkUpdate,
    TIMELINE_EVENT_IDS.julyVoiceUpdate,
  ],
};

export const seedObservation = seedThreadObservation;

