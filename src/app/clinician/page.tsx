import { ClinicianTodayPage } from "@/components/clinician/clinician-today-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today’s appointments | Thread",
  description: "Dr Rahman’s appointment working list for today.",
};

export default function ClinicianPage() {
  return <ClinicianTodayPage />;
}
