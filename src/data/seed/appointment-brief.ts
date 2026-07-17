import {
  APPOINTMENT_BRIEF_ID,
  EVIDENCE_IDS,
} from "@/data/seed/ids";
import { demoPatient } from "@/data/seed/patient";
import type { AppointmentBrief } from "@/server/types/domain";

export const seedAppointmentBrief: AppointmentBrief = {
  id: APPOINTMENT_BRIEF_ID,
  patientId: demoPatient.id,
  appointment: {
    title: "Gynaecology review",
    organisation: "University College London Hospital",
    date: "2026-07-24T10:30:00+01:00",
    appointmentType: "Consultant review",
    location: "Gynaecology Outpatients, UCLH",
  },
  status: "draft",
  generatedAt: "2026-07-17T15:10:00+01:00",
  patientPriorities: [
    "Better pain control",
    "Medication side effects",
    "Impact on work",
  ],
  sections: [
    {
      id: "71000000-0000-4000-8000-000000000001",
      key: "main_concern",
      title: "Main concern",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000001",
          text: "Amina reports worsening pelvic and lower-back pain across the last three recorded cycles.",
          evidenceIds: [
            EVIDENCE_IDS.mayPain,
            EVIDENCE_IDS.voicePain,
            EVIDENCE_IDS.julyPainAndSleep,
          ],
          evidenceCount: 3,
        },
      ],
    },
    {
      id: "71000000-0000-4000-8000-000000000002",
      key: "changes_since_last_review",
      title: "Changes since last review",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000002",
          text: "Pain increased from 5/10 to 8/10 in patient-recorded updates.",
          evidenceIds: [
            EVIDENCE_IDS.mayPain,
            EVIDENCE_IDS.julyPainAndSleep,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000003",
          text: "Symptoms have interrupted sleep.",
          evidenceIds: [
            EVIDENCE_IDS.juneSleep,
            EVIDENCE_IDS.julyPainAndSleep,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000004",
          text: "Amina left work early on two occasions.",
          evidenceIds: [
            EVIDENCE_IDS.voiceWork,
            EVIDENCE_IDS.secondEarlyDeparture,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000005",
          text: "Symptoms persisted after the May A&E attendance.",
          evidenceIds: [
            EVIDENCE_IDS.emergencyReason,
            EVIDENCE_IDS.postEmergencySymptoms,
            EVIDENCE_IDS.voicePain,
          ],
          evidenceCount: 3,
        },
      ],
    },
    {
      id: "71000000-0000-4000-8000-000000000003",
      key: "medication",
      title: "Medication",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000006",
          text: "Amina reports nausea after taking prescribed pain medication.",
          evidenceIds: [
            EVIDENCE_IDS.gpNaproxen,
            EVIDENCE_IDS.medicationNausea,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000007",
          text: "She later avoided a dose because she was concerned about the nausea recurring.",
          evidenceIds: [
            EVIDENCE_IDS.medicationNausea,
            EVIDENCE_IDS.avoidedMedication,
          ],
          evidenceCount: 2,
        },
      ],
    },
    {
      id: "71000000-0000-4000-8000-000000000004",
      key: "relevant_encounter",
      title: "Relevant encounter",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000008",
          text: "UCLH Emergency Department attendance on 17 May 2026.",
          evidenceIds: [EVIDENCE_IDS.emergencyReason],
          evidenceCount: 1,
        },
        {
          id: "70000000-0000-4000-8000-000000000009",
          text: "Stable observations.",
          evidenceIds: [EVIDENCE_IDS.emergencyObservations],
          evidenceCount: 1,
        },
        {
          id: "70000000-0000-4000-8000-000000000010",
          text: "Blood results within the displayed reference ranges.",
          evidenceIds: [
            EVIDENCE_IDS.emergencyBloods,
            EVIDENCE_IDS.emergencyPregnancyTest,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000011",
          text: "Discharged with GP follow-up advice.",
          evidenceIds: [
            EVIDENCE_IDS.emergencyDisposition,
            EVIDENCE_IDS.emergencyFollowUp,
          ],
          evidenceCount: 2,
        },
      ],
    },
    {
      id: "71000000-0000-4000-8000-000000000005",
      key: "patient_priorities",
      title: "Patient priorities",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000012",
          text: "Discuss pain management.",
          evidenceIds: [
            EVIDENCE_IDS.questionIncreasingPain,
            EVIDENCE_IDS.julyPainAndSleep,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000013",
          text: "Discuss medication-related nausea.",
          evidenceIds: [
            EVIDENCE_IDS.medicationNausea,
            EVIDENCE_IDS.alternativeMedicationQuestion,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000014",
          text: "Discuss impact on work.",
          evidenceIds: [
            EVIDENCE_IDS.voiceWork,
            EVIDENCE_IDS.secondEarlyDeparture,
            EVIDENCE_IDS.workConfidence,
          ],
          evidenceCount: 3,
        },
      ],
    },
    {
      id: "71000000-0000-4000-8000-000000000006",
      key: "patient_questions",
      title: "Patient questions",
      items: [
        {
          id: "70000000-0000-4000-8000-000000000015",
          text: "Are there alternative options that may cause less nausea?",
          evidenceIds: [
            EVIDENCE_IDS.medicationNausea,
            EVIDENCE_IDS.alternativeMedicationQuestion,
          ],
          evidenceCount: 2,
        },
        {
          id: "70000000-0000-4000-8000-000000000016",
          text: "Why has the pain been increasing?",
          evidenceIds: [EVIDENCE_IDS.questionIncreasingPain],
          evidenceCount: 1,
        },
        {
          id: "70000000-0000-4000-8000-000000000017",
          text: "What are the next steps in her care?",
          evidenceIds: [EVIDENCE_IDS.questionNextSteps],
          evidenceCount: 1,
        },
      ],
    },
  ],
  reviewNotice: "Review before sharing.",
  evidenceIds: [
    EVIDENCE_IDS.mayPain,
    EVIDENCE_IDS.emergencyReason,
    EVIDENCE_IDS.emergencyObservations,
    EVIDENCE_IDS.emergencyBloods,
    EVIDENCE_IDS.emergencyPregnancyTest,
    EVIDENCE_IDS.emergencyDisposition,
    EVIDENCE_IDS.emergencyFollowUp,
    EVIDENCE_IDS.postEmergencySymptoms,
    EVIDENCE_IDS.gpNaproxen,
    EVIDENCE_IDS.voicePain,
    EVIDENCE_IDS.voiceWork,
    EVIDENCE_IDS.medicationNausea,
    EVIDENCE_IDS.juneSleep,
    EVIDENCE_IDS.secondEarlyDeparture,
    EVIDENCE_IDS.questionIncreasingPain,
    EVIDENCE_IDS.questionNextSteps,
    EVIDENCE_IDS.julyPainAndSleep,
    EVIDENCE_IDS.avoidedMedication,
    EVIDENCE_IDS.alternativeMedicationQuestion,
    EVIDENCE_IDS.workConfidence,
  ],
};

export const demoAppointmentBrief = seedAppointmentBrief;

