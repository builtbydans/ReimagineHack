import { ClinicianDashboard } from "@/components/clinician/clinician-dashboard";
import { AMINA_PATIENT_ID } from "@/lib/constants";
import { clinicianContextService } from "@/server/services/clinician-context-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Amina Khan pre-appointment summary | Thread",
  description: "Amina Khan’s concise, evidence-backed pre-appointment workspace.",
};

export default async function AppointmentSummaryPage() {
  const context = await clinicianContextService.getContext(AMINA_PATIENT_ID);
  return <ClinicianDashboard mode="summary" context={context} />;
}
