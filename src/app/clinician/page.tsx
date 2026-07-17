import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinician context | Thread",
  description: "Amina Khan’s evidence-backed longitudinal health context.",
};

export default function ClinicianPage() {
  return <ClinicianDashboard />;
}
