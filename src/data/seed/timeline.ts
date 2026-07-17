import { seedEvidenceReferences } from "@/data/seed/evidence";
import { seedImportedEncounter } from "@/data/seed/encounter";
import { TIMELINE_EVENT_IDS } from "@/data/seed/ids";
import { seedThreadObservation } from "@/data/seed/observation";
import { demoPatient } from "@/data/seed/patient";
import type { TimelineEvent } from "@/server/types/domain";

const observationEvidence = seedEvidenceReferences.filter((reference) =>
  seedThreadObservation.evidenceIds.includes(reference.id),
);

/** Seeded newest-first so patient and clinician timelines show recent context first. */
export const seedTimelineEvents: TimelineEvent[] = [
  {
    id: TIMELINE_EVENT_IDS.threadObservation,
    patientId: demoPatient.id,
    type: "ai_observation",
    title: "What Thread has noticed",
    summary:
      "Your recorded pelvic pain has increased across the last three cycles. Sleep and work have also been affected more often.",
    recordedAt: "2026-07-17T14:00:00+01:00",
    sourceKind: "ai_organised",
    evidenceRefs: observationEvidence,
    metadata: {
      badge: "AI-organised",
      clinicalVerificationStatus: "not_clinically_verified",
      evidenceSummary: "Based on 5 updates and 2 encounters.",
      statements: seedThreadObservation.statements,
    },
  },
  {
    id: TIMELINE_EVENT_IDS.julyTextUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Period pain affecting confidence at work",
    summary:
      "Amina reported that her period had begun, standing increased discomfort and she nearly called in sick. She wants to discuss options that may cause less nausea.",
    recordedAt: "2026-07-16T08:12:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "My period started today. I nearly called in sick again because standing makes the pain worse. I want to ask if there is something else that does not make me feel sick. It is making me less confident that I can get through a shift.",
    bodyLocations: ["Pelvis", "Lower abdomen"],
    symptoms: ["Pelvic pain", "Discomfort while standing"],
    functionalImpacts: [
      "Nearly called in sick",
      "Standing increased discomfort",
      "Reduced confidence at work",
    ],
    medicationDetails: {
      medicationName: "Naproxen",
      action: "Wants to discuss alternatives",
      adherence: "Concerned about taking because of prior nausea",
      reportedSideEffects: ["Nausea"],
    },
    metadata: {
      questionsForNextAppointment: [
        "Are there alternative options that may cause less nausea?",
      ],
    },
  },
  {
    id: TIMELINE_EVENT_IDS.julyVoiceUpdate,
    patientId: demoPatient.id,
    type: "patient_voice",
    title: "Pain woke Amina overnight",
    summary:
      "Amina reported pelvic and lower-back pain at 8/10 that woke her overnight. She avoided naproxen because of concern that nausea would recur.",
    recordedAt: "2026-07-10T07:42:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "I woke up in the night because the pain was so strong. It was about eight out of ten, across my pelvis and into my lower back. I did not take the naproxen because I was worried I would feel sick again.",
    severity: 8,
    bodyLocations: ["Pelvis", "Lower back"],
    symptoms: ["Pelvic pain", "Lower-back pain", "Sleep disruption"],
    functionalImpacts: ["Woken during the night"],
    medicationDetails: {
      medicationName: "Naproxen",
      action: "Avoided a dose",
      adherence: "Dose avoided because of concern about nausea recurring",
      reportedSideEffects: ["Nausea previously reported"],
    },
  },
  {
    id: TIMELINE_EVENT_IDS.julyReferralUpdate,
    patientId: demoPatient.id,
    type: "referral",
    title: "Gynaecology review booked",
    summary:
      "Gynaecology review booked for 24 July 2026. Amina wants to discuss worsening symptoms and understand next steps.",
    recordedAt: "2026-07-04T10:00:00+01:00",
    sourceKind: "imported_clinical_record",
    organisation: "University College London Hospital",
    location: "Gynaecology Outpatients, UCLH",
    originalText:
      "I want to ask why the pain has been increasing. I also want to understand the next steps in my care.",
    metadata: {
      appointmentDate: "2026-07-24T10:30:00+01:00",
      appointmentType: "Consultant review",
      patientNoteSource: "patient_reported",
      questionsForNextAppointment: [
        "Why has the pain been increasing?",
        "What are the next steps in her care?",
      ],
    },
  },
  {
    id: TIMELINE_EVENT_IDS.juneWorkUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Left work early for a second time",
    summary:
      "Amina reported pain at 6/10 and left her shift early after standing made it worse.",
    recordedAt: "2026-06-30T17:48:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "Pain was 6/10 this afternoon. I tried to keep working but standing made it worse, so I left my shift early for the second time this month.",
    severity: 6,
    bodyLocations: ["Pelvis"],
    symptoms: ["Pelvic pain", "Pain worse while standing"],
    functionalImpacts: ["Left work early", "Difficulty standing"],
  },
  {
    id: TIMELINE_EVENT_IDS.juneTextUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Fatigue and poor sleep",
    summary:
      "Amina reported fatigue, pain at 5/10 and poor sleep. She did not miss work.",
    recordedAt: "2026-06-21T18:55:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "Pain was about 5/10 and I felt tired. I slept poorly, although I did not miss work.",
    severity: 5,
    bodyLocations: ["Pelvis"],
    symptoms: ["Pelvic pain", "Fatigue", "Poor sleep"],
    functionalImpacts: ["Sleep affected", "No work absence"],
  },
  {
    id: TIMELINE_EVENT_IDS.juneMedicationUpdate,
    patientId: demoPatient.id,
    type: "medication_update",
    title: "Nausea after naproxen",
    summary:
      "Amina reported nausea after taking naproxen and was unsure whether to take another dose if pain returned.",
    recordedAt: "2026-06-13T09:35:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "I took the naproxen after food but felt nauseous afterwards. I’m not sure whether to take another dose if the pain comes back.",
    symptoms: ["Nausea"],
    medicationDetails: {
      medicationName: "Naproxen",
      action: "Taken as prescribed",
      adherence: "Unsure about a further dose",
      reportedSideEffects: ["Nausea"],
    },
  },
  {
    id: TIMELINE_EVENT_IDS.juneUrduVoiceUpdate,
    patientId: demoPatient.id,
    type: "patient_voice",
    title: "Pain spread to lower back and affected work",
    summary:
      "In a translated Urdu voice update, Amina reported lower-abdominal pain at 7/10 spreading to her lower back. She could not stand for long and left work early.",
    recordedAt: "2026-06-12T21:18:00+01:00",
    sourceKind: "patient_reported",
    language: "Urdu (Roman Urdu)",
    originalText:
      "Kal raat mere pait ke neeche bohat tez dard tha, takreeban saat das mein se. Dard kamar tak ja raha tha. Main kaam par zyada dair khari nahi reh saki aur jaldi ghar aana para.",
    translatedText:
      "Last night I had strong pain in my lower abdomen, around seven out of ten. The pain spread to my lower back. I could not stand for long at work and had to leave early.",
    severity: 7,
    bodyLocations: ["Lower abdomen", "Lower back"],
    symptoms: ["Pelvic pain", "Lower-back pain"],
    functionalImpacts: [
      "Could not stand for long at work",
      "Left work early",
    ],
    metadata: {
      translationStatus: "demonstration_translation",
    },
  },
  {
    id: TIMELINE_EVENT_IDS.juneGpReview,
    patientId: demoPatient.id,
    type: "gp_review",
    title: "GP symptom-tracking review",
    summary:
      "The GP record states that Amina continued to report cyclical pelvic pain. The referral remained in progress and symptom tracking was discussed.",
    recordedAt: "2026-06-04T15:40:00+01:00",
    sourceKind: "imported_clinical_record",
    organisation: "Bloomsbury Surgery",
    location: "London",
    symptoms: ["Ongoing cyclical pelvic pain"],
    metadata: {
      clinicianNote:
        "Patient reports ongoing cyclical pelvic pain. Referral remains in progress; advised to continue tracking symptoms for specialist review.",
      synthetic: true,
    },
  },
  {
    id: TIMELINE_EVENT_IDS.mayGpReview,
    patientId: demoPatient.id,
    type: "gp_review",
    title: "GP review after A&E attendance",
    summary:
      "Amina was reviewed after the A&E visit. Naproxen was discussed and prescribed, a gynaecology referral was made and symptom tracking was advised.",
    recordedAt: "2026-05-28T11:15:00+01:00",
    sourceKind: "imported_clinical_record",
    organisation: "Bloomsbury Surgery",
    location: "London",
    medicationDetails: {
      medicationName: "Naproxen",
      action: "Discussed and prescribed",
      adherence: "Not recorded in this encounter",
      reportedSideEffects: [],
    },
    metadata: {
      referralMade: true,
      referralSpecialty: "Gynaecology",
      advice: "Track symptoms for specialist review",
      synthetic: true,
    },
  },
  {
    id: TIMELINE_EVENT_IDS.postEmergencyUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Pain eased, pelvic heaviness continued",
    summary:
      "Amina reported that pain had improved from the A&E episode, although pelvic heaviness continued and she was concerned symptoms might return.",
    recordedAt: "2026-05-20T20:05:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "The severe pain has eased since A&E, but I still have pelvic heaviness and I am worried it will come back.",
    bodyLocations: ["Pelvis"],
    symptoms: ["Pelvic heaviness", "Improving pelvic pain"],
    functionalImpacts: ["Concern about symptoms returning"],
  },
  {
    id: TIMELINE_EVENT_IDS.uclhEmergencyEncounter,
    patientId: demoPatient.id,
    type: "ae_encounter",
    title: "UCLH Emergency Department",
    summary:
      "Presented with worsening lower abdominal and pelvic pain reported as 8/10. Observations were stable, displayed blood results were within reference ranges and the pregnancy test was negative. Analgesia was administered before discharge with GP follow-up advice.",
    recordedAt: "2026-05-17T18:42:00+01:00",
    sourceKind: "imported_clinical_record",
    organisation: "University College London Hospital",
    location: "Emergency Department, London",
    severity: 8,
    bodyLocations: ["Lower abdomen", "Pelvis"],
    symptoms: ["Severe pelvic pain", "Lower abdominal pain"],
    observations: {
      heartRate: "84 bpm",
      bloodPressure: "124/78 mmHg",
      temperature: "36.8°C",
      oxygenSaturation: "99%",
      respiratoryRate: 16,
    },
    bloodResults: seedImportedEncounter.structuredData.bloodResults,
    encounterDetails: seedImportedEncounter.structuredData,
    metadata: {
      importedEncounterId: seedImportedEncounter.id,
      source: "Synthetic UCLH discharge record",
      importedEncounter: true,
      manuallyEnteredByPatient: false,
      syntheticDemonstrationValues: true,
      directNhsConnection: false,
    },
  },
  {
    id: TIMELINE_EVENT_IDS.mayTextUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Pelvic pain before period",
    summary:
      "Amina reported pelvic pain at 5/10 and fatigue the day before her expected period. She completed work.",
    recordedAt: "2026-05-14T19:20:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "Pelvic pain was around 5/10 today. My period is expected tomorrow. I felt tired but completed my shift at work.",
    severity: 5,
    bodyLocations: ["Pelvis"],
    symptoms: ["Pelvic pain", "Fatigue"],
    functionalImpacts: ["Completed work"],
  },
  {
    id: TIMELINE_EVENT_IDS.aprilMedicationUpdate,
    patientId: demoPatient.id,
    type: "medication_update",
    title: "Naproxen provided partial relief",
    summary:
      "Amina reported taking naproxen with partial relief. No side effects were recorded in this update.",
    recordedAt: "2026-04-18T13:25:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "I took naproxen and it helped a little. I did not notice any side effects.",
    medicationDetails: {
      medicationName: "Naproxen",
      action: "Taken",
      adherence: "Dose taken",
      reportedSideEffects: [],
    },
  },
  {
    id: TIMELINE_EVENT_IDS.aprilTextUpdate,
    patientId: demoPatient.id,
    type: "patient_text",
    title: "Pelvic pain and fatigue",
    summary:
      "Amina reported pelvic pain at 4/10 and fatigue before her expected period. She managed normal activities.",
    recordedAt: "2026-04-14T09:10:00+01:00",
    sourceKind: "patient_reported",
    language: "English",
    originalText:
      "Pelvic pain was 4/10 today. My period is expected soon and I feel tired. I still managed my normal activities today.",
    severity: 4,
    bodyLocations: ["Pelvis"],
    symptoms: ["Pelvic pain", "Fatigue"],
    functionalImpacts: ["Managed normal activities"],
  },
];

export const seedTimelineEventsChronological = [...seedTimelineEvents].reverse();

