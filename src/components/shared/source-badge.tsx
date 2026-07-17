import { Bot, FileCheck2, Mic2, PenLine, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceKind } from "@/server/types/domain";

export function SourceBadge({ sourceKind, compact = false }: { sourceKind: SourceKind; compact?: boolean }) {
  if (sourceKind === "patient_reported") {
    return <Badge variant="patient"><PenLine />{compact ? "Patient" : "Patient-reported"}</Badge>;
  }
  if (sourceKind === "imported_clinical_record") {
    return <Badge variant="clinical"><FileCheck2 />{compact ? "Imported" : "Imported encounter"}</Badge>;
  }
  return <Badge variant="ai"><Bot />{compact ? "AI-organised" : "AI-organised"}</Badge>;
}

export function VerificationBadge({ compact = false }: { compact?: boolean }) {
  return <Badge variant="outline"><ShieldCheck />{compact ? "Not verified" : "Not clinically verified"}</Badge>;
}

export function VoiceBadge({ translated = false }: { translated?: boolean }) {
  return <Badge variant="patient"><Mic2 />{translated ? "Translated voice update" : "Voice update"}</Badge>;
}
