import {
  Bot,
  ClipboardPlus,
  FileHeart,
  FlaskConical,
  Hospital,
  Mic2,
  Pill,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEventType } from "@/server/types/domain";

const iconMap = {
  patient_text: FileHeart,
  patient_voice: Mic2,
  medication_update: Pill,
  ae_encounter: Hospital,
  gp_review: Stethoscope,
  specialist_review: ClipboardPlus,
  test_result: FlaskConical,
  referral: ClipboardPlus,
  ai_observation: Bot,
} satisfies Record<TimelineEventType, typeof FileHeart>;

const styleMap = {
  patient_text: "bg-plum-100 text-plum-700 ring-plum-50",
  patient_voice: "bg-plum-100 text-plum-700 ring-plum-50",
  medication_update: "bg-amber-100 text-amber-700 ring-amber-50",
  ae_encounter: "bg-sage-100 text-sage-700 ring-sage-50",
  gp_review: "bg-sage-100 text-sage-700 ring-sage-50",
  specialist_review: "bg-sage-100 text-sage-700 ring-sage-50",
  test_result: "bg-sage-100 text-sage-700 ring-sage-50",
  referral: "bg-sage-100 text-sage-700 ring-sage-50",
  ai_observation: "bg-amber-100 text-amber-700 ring-amber-50",
} satisfies Record<TimelineEventType, string>;

export function EventIcon({ type, className }: { type: TimelineEventType; className?: string }) {
  const Icon = iconMap[type];
  return (
    <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl ring-4", styleMap[type], className)}>
      <Icon className="size-4" />
    </span>
  );
}
