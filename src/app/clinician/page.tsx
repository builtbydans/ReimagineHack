import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointment summary | Thread",
  description: "Amina Khan’s concise, evidence-backed appointment summary.",
};

export default function ClinicianPage() {
  return <ClinicianDashboard mode="summary" />;
}
