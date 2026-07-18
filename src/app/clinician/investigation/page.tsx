import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import { AMINA_PATIENT_ID } from "@/lib/constants";
import { clinicianContextService } from "@/server/services/clinician-context-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Clinical investigation | Thread",
  description: "Inspectable evidence behind Amina Khan’s appointment summary.",
};

export default async function ClinicalInvestigationPage() {
  const context = await clinicianContextService.getContext(AMINA_PATIENT_ID);
  return <ClinicianDashboard mode="investigation" context={context} />;
}
