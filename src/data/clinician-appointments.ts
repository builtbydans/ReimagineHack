export type ClinicianAppointment = {
  time: string;
  patientName: string;
  reason: string;
  status: "Completed" | "Up next" | "Upcoming";
  age?: number;
  condition?: string;
  lastEncounter?: string;
  context?: string;
};

export const clinicianAppointments: ClinicianAppointment[] = [
  {
    time: "11:30",
    patientName: "James Wilson",
    reason: "Medication review",
    status: "Completed",
  },
  {
    time: "12:00",
    patientName: "Priya Patel",
    reason: "Asthma follow-up",
    status: "Completed",
  },
  {
    time: "12:30",
    patientName: "Amina Khan",
    age: 32,
    condition: "Endometriosis",
    lastEncounter: "4 June 2026",
    reason: "Worsening pelvic pain",
    context: "Worsening pain, interrupted sleep and medication-related nausea",
    status: "Up next",
  },
  {
    time: "13:00",
    patientName: "David Clarke",
    reason: "Blood pressure review",
    status: "Upcoming",
  },
];

