import { demoPatient } from "@/data/seed/patient";
import {
  IMPORTED_ENCOUNTER_ID,
  TIMELINE_EVENT_IDS,
} from "@/data/seed/ids";
import type {
  BloodResult,
  ClinicalObservation,
  EncounterDetails,
  ImportedEncounter,
} from "@/server/types/domain";

export const uclhEmergencyObservations: ClinicalObservation[] = [
  { name: "Heart rate", value: "84 bpm" },
  { name: "Blood pressure", value: "124/78 mmHg" },
  { name: "Temperature", value: "36.8°C" },
  { name: "Oxygen saturation", value: "99%" },
  { name: "Respiratory rate", value: "16" },
];

export const uclhEmergencyBloodResults: BloodResult[] = [
  {
    name: "Haemoglobin",
    value: "126 g/L",
    status: "within_range",
    referenceRange: "115–160 g/L",
  },
  {
    name: "White cell count",
    value: "7.4 ×10⁹/L",
    status: "within_range",
    referenceRange: "4.0–11.0 ×10⁹/L",
  },
  {
    name: "CRP",
    value: "3 mg/L",
    status: "within_range",
    referenceRange: "0–5 mg/L",
  },
  {
    name: "Platelets",
    value: "284 ×10⁹/L",
    status: "within_range",
    referenceRange: "150–400 ×10⁹/L",
  },
  {
    name: "Pregnancy test",
    value: "Negative",
    status: "within_range",
  },
];

export const uclhEmergencyEncounterDetails: EncounterDetails = {
  reason: "Severe pelvic pain.",
  summaryPoints: [
    "Presented with worsening lower abdominal and pelvic pain.",
    "Pain reported as 8/10.",
    "Pregnancy test negative.",
    "Haemoglobin within reference range.",
    "White cell count within reference range.",
    "CRP within reference range.",
    "Observations stable.",
    "Analgesia administered.",
    "Discharged home.",
    "Advised to arrange GP follow-up.",
    "Return advice provided if symptoms significantly worsen.",
  ],
  observations: uclhEmergencyObservations,
  bloodResults: uclhEmergencyBloodResults,
  clinicianNote:
    "Presented with worsening lower abdominal and pelvic pain, reported as 8/10. Observations remained stable. Pregnancy test was negative and displayed blood results were within reference ranges. Analgesia was administered. Discharged home with GP follow-up and return advice.",
  sourceRecord: {
    label: "Synthetic UCLH discharge record",
    provider: "University College London Hospital",
    sourceReference: "SYNTH-UCLH-ED-2026-05-17-AK",
    synthetic: true,
    imported: true,
    manuallyEnteredByPatient: false,
  },
  disposition: "Discharged home after analgesia was administered.",
  followUpAdvice: "Advised to arrange GP follow-up.",
  returnAdvice:
    "Return advice provided if symptoms significantly worsen.",
};

export const seedImportedEncounter: ImportedEncounter = {
  id: IMPORTED_ENCOUNTER_ID,
  patientId: demoPatient.id,
  timelineEventId: TIMELINE_EVENT_IDS.uclhEmergencyEncounter,
  provider: "University College London Hospital",
  encounterType: "Emergency Department attendance",
  encounterDate: "2026-05-17T18:42:00+01:00",
  sourceReference: "SYNTH-UCLH-ED-2026-05-17-AK",
  sourceLabel: "Synthetic UCLH discharge record",
  status: "imported",
  synthetic: true,
  rawPayload: {
    demonstrationOnly: true,
    directNhsConnection: false,
    recordType: "synthetic_discharge_record",
  },
  structuredData: uclhEmergencyEncounterDetails,
};

export const uclhEmergencyEncounter = seedImportedEncounter;
export const seedImportedEncounters: ImportedEncounter[] = [
  seedImportedEncounter,
];
