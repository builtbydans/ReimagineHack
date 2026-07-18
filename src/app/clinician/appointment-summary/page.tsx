import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amina Khan pre-appointment summary | Thread",
  description: "Amina Khan’s concise, evidence-backed pre-appointment workspace.",
};

export default function AppointmentSummaryPage() {
  return <ClinicianDashboard mode="summary" />;
}
