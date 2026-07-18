import { ClinicianTodayPage } from "@/components/clinician/clinician-today-page";
import { AMINA_PATIENT_ID } from "@/lib/constants";
import { clinicianContextService } from "@/server/services/clinician-context-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Today’s appointments | Thread",
  description: "Dr Rahman’s appointment working list for today.",
};

export default async function ClinicianPage() {
  const context = await clinicianContextService.getContext(AMINA_PATIENT_ID);
  return <ClinicianTodayPage context={context} />;
}
