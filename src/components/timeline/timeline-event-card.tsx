"use client";

import { format } from "date-fns";
import { ArrowUpRight, Bed, BriefcaseBusiness, ChevronRight, MapPin, Pill, Volume2 } from "lucide-react";
import { EventIcon } from "@/components/timeline/event-icon";
import { SourceBadge, VerificationBadge, VoiceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/server/types/domain";

const eventLabel: Record<TimelineEvent["type"], string> = {
  patient_text: "Written update",
  patient_voice: "Voice update",
  medication_update: "Medication update",
  ae_encounter: "A&E encounter",
  gp_review: "GP review",
  specialist_review: "Specialist review",
  test_result: "Test result",
  referral: "Referral",
  ai_observation: "Thread observation",
};

export function TimelineEventCard({
  event,
  compact = false,
  onViewEvidence,
  onViewEncounter,
}: {
  event: TimelineEvent;
  compact?: boolean;
  onViewEvidence?: (event: TimelineEvent) => void;
  onViewEncounter?: (event: TimelineEvent) => void;
}) {
  const isEncounter = Boolean(event.encounterDetails);
  const isAi = event.sourceKind === "ai_organised";

  return (
    <article className={cn("group relative grid grid-cols-[2.25rem_1fr] gap-3 animate-fade-up", compact ? "pb-5" : "pb-7 sm:grid-cols-[2.5rem_1fr] sm:gap-4")}>
      <div className="absolute bottom-0 left-[17px] top-9 w-px bg-plum-200/80 sm:left-[19px]" aria-hidden="true" />
      <EventIcon type={event.type} className={compact ? "size-9" : "sm:size-10"} />
      <div className={cn("rounded-[1.25rem] border bg-white shadow-card transition-all duration-200 group-hover:border-plum-200 group-hover:shadow-soft", compact ? "p-4" : "p-4 sm:p-5", isAi && "border-amber-200 bg-amber-50/45")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            <span className="font-semibold uppercase tracking-[.09em] text-plum-600">{eventLabel[event.type]}</span>
            <span className="text-border">•</span>
            <time className="text-muted-foreground" dateTime={event.recordedAt}>{format(new Date(event.recordedAt), compact ? "d MMM" : "d MMM yyyy · HH:mm")}</time>
          </div>
          {event.severity !== undefined ? <Badge variant={event.severity >= 7 ? "warning" : "patient"}>{event.severity}/10 reported</Badge> : null}
        </div>

        <h3 className={cn("mt-2 font-semibold tracking-[-.02em]", compact ? "text-sm" : "text-base")}>{event.title}</h3>
        <p className={cn("mt-1.5 leading-relaxed text-muted-foreground", compact ? "line-clamp-2 text-xs" : "text-sm")}>{event.summary}</p>

        {!compact && (event.organisation || event.bodyLocations?.length || event.functionalImpacts?.length) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {event.organisation ? <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"><MapPin className="size-3" />{event.organisation}</span> : null}
            {event.bodyLocations?.slice(0, 2).map((location) => <span key={location} className="rounded-full bg-plum-50 px-2.5 py-1 text-[11px] text-plum-700">{location}</span>)}
            {event.functionalImpacts?.some((impact) => impact.toLowerCase().includes("work")) ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700"><BriefcaseBusiness className="size-3" />Work affected</span> : null}
            {event.functionalImpacts?.some((impact) => impact.toLowerCase().includes("sleep") || impact.toLowerCase().includes("woke")) ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700"><Bed className="size-3" />Sleep affected</span> : null}
            {event.medicationDetails ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700"><Pill className="size-3" />{event.medicationDetails.medicationName ?? "Medication"}</span> : null}
          </div>
        ) : null}

        {event.type === "patient_voice" && !compact ? (
          <div className="mt-4 rounded-xl border border-plum-100 bg-plum-50/70 p-3">
            <div className="flex items-center gap-2"><Volume2 className="size-3.5 text-plum-600" /><VoiceBadge translated={Boolean(event.translatedText)} /></div>
            {event.originalText ? <p className="mt-2 line-clamp-2 text-xs italic leading-5 text-plum-900">“{event.originalText}”</p> : null}
            {event.translatedText ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.translatedText}</p> : null}
          </div>
        ) : null}

        <div className={cn("mt-4 flex flex-wrap items-center gap-2", compact && "mt-3")}>
          <SourceBadge sourceKind={event.sourceKind} compact={compact} />
          {isAi ? <VerificationBadge compact={compact} /> : null}
          <div className="ml-auto">
            {isAi && onViewEvidence ? (
              <Button variant="ghost" size="sm" onClick={() => onViewEvidence(event)} className="h-8 px-2 text-plum-700">{event.evidenceRefs?.length ?? 0} sources <ChevronRight /></Button>
            ) : null}
            {isEncounter && onViewEncounter ? (
              <Button variant="ghost" size="sm" onClick={() => onViewEncounter(event)} className="h-8 px-2 text-sage-700">View record <ArrowUpRight /></Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
