import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinical investigation | Thread",
  description: "Inspectable evidence behind Amina Khan’s appointment summary.",
};

export default function ClinicalInvestigationPage() {
  return <ClinicianDashboard mode="investigation" />;
}
