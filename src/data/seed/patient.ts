import type { Patient } from "@/server/types/domain";

import { DEMO_PATIENT_ID } from "@/data/seed/ids";

export const demoPatient: Patient = {
  id: DEMO_PATIENT_ID,
  name: "Amina Khan",
  dateOfBirth: "1993-10-11",
  age: 32,
  condition: "Endometriosis",
  preferredLanguage: "Urdu",
  nextAppointment: {
    title: "Gynaecology review",
    organisation: "University College London Hospital",
    date: "2026-07-24T10:30:00+01:00",
    appointmentType: "Consultant review",
    location: "Gynaecology Outpatients, UCLH",
  },
};

export const seedPatient = demoPatient;

