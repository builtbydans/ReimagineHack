"use client";

import Link from "next/link";
import {
  Activity,
  CalendarRange,
  CirclePlus,
  FileHeart,
  FlaskConical,
  ListFilter,
  Pill,
  UserRound,
} from "lucide-react";
import * as React from "react";

import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { useDemoData } from "@/components/shared/demo-data-provider";
import { SafetyNotice } from "@/components/shared/safety-notice";
import { EncounterDetailsSheet } from "@/components/timeline/encounter-details-sheet";
import { PainTrendCard } from "@/components/timeline/pain-trend-card";
import { TimelineList } from "@/components/timeline/timeline-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { seedEvidenceReferences } from "@/data/seed";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/server/types/domain";

type TimelineFilter = "all" | "updates" | "encounters" | "medication" | "results";

const filterOptions: Array<{ value: TimelineFilter; label: string; icon: typeof Activity }> = [
  { value: "all", label: "All", icon: CalendarRange },
  { value: "updates", label: "My updates", icon: UserRound },
  { value: "encounters", label: "Encounters", icon: FileHeart },
  { value: "medication", label: "Medication", icon: Pill },
  { value: "results", label: "Results", icon: FlaskConical },
];

function eventMatchesFilter(event: TimelineEvent, filter: TimelineFilter) {
  if (filter === "all") return true;
  if (filter === "updates") return event.type === "patient_text" || event.type === "patient_voice";
  if (filter === "encounters") return ["ae_encounter", "gp_review", "specialist_review", "referral"].includes(event.type);
  if (filter === "medication") return event.type === "medication_update" || Boolean(event.medicationDetails);
  return event.type === "test_result" || Boolean(event.bloodResults?.length);
}

export default function PatientTimelinePage() {
  const { events, isHydrated } = useDemoData();
  const [filter, setFilter] = React.useState<TimelineFilter>("all");
  const [evidenceEvent, setEvidenceEvent] = React.useState<TimelineEvent | null>(null);
  const [encounterEvent, setEncounterEvent] = React.useState<TimelineEvent | null>(null);

  const filteredEvents = React.useMemo(
    () => events.filter((event) => eventMatchesFilter(event, filter)),
    [events, filter],
  );
  const patientReportedCount = events.filter((event) => event.sourceKind === "patient_reported").length;
  const importedCount = events.filter((event) => event.sourceKind === "imported_clinical_record").length;
  const organisedCount = events.filter((event) => event.sourceKind === "ai_organised").length;
  const evidence = evidenceEvent?.evidenceRefs?.length
    ? evidenceEvent.evidenceRefs
    : seedEvidenceReferences;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-7 sm:py-10 lg:px-8">
      <header className="animate-fade-up sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-plum-500">
            <Activity className="size-3.5" /> Amina&apos;s Thread
          </div>
          <h1 className="mt-2 text-[clamp(2.1rem,7vw,3.6rem)] font-semibold leading-none tracking-[-.055em] text-plum-950">Your health story</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Your updates, healthcare encounters and important changes — connected in one chronological view.
          </p>
        </div>
        <Button asChild className="mt-5 sm:mt-0">
          <Link href="/patient/update"><CirclePlus /> Add an update</Link>
        </Button>
      </header>

      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-stretch">
        <PainTrendCard />
        <Card className="flex flex-col justify-between overflow-hidden bg-plum-950 p-5 text-white sm:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-plum-300">Story at a glance</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-.05em]">{events.length}</p>
            <p className="mt-1 text-xs text-plum-200/75">connected moments since April</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/8 p-3"><span className="block text-xl font-semibold">{patientReportedCount}</span><span className="text-plum-200/75">your updates</span></div>
            <div className="rounded-xl bg-white/8 p-3"><span className="block text-xl font-semibold">{importedCount}</span><span className="text-plum-200/75">care records</span></div>
          </div>
          <p className="mt-2 text-[10px] text-plum-200/65">Plus {organisedCount} evidence-linked Thread {organisedCount === 1 ? "observation" : "observations"}</p>
        </Card>
      </section>

      <section className="mt-8">
        <div className="sticky top-[4.5rem] z-30 -mx-5 border-y border-plum-100/80 bg-[#f7f4ef]/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" role="toolbar" aria-label="Filter timeline">
            <span className="mr-1 hidden size-9 shrink-0 items-center justify-center rounded-xl bg-white text-plum-600 sm:flex"><ListFilter className="size-4" /></span>
            {filterOptions.map((option) => {
              const active = filter === option.value;
              const Icon = option.icon;
              const count = events.filter((event) => eventMatchesFilter(event, option.value)).length;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all",
                    active ? "bg-plum-950 text-white shadow-sm" : "bg-white/75 text-muted-foreground hover:bg-white hover:text-plum-800",
                  )}
                >
                  <Icon className="size-3.5" />
                  {option.label}
                  <span className={cn("text-[10px]", active ? "text-plum-200" : "text-muted-foreground/70")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 max-w-3xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-plum-500">{filterOptions.find((item) => item.value === filter)?.label}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">{filteredEvents.length} {filteredEvents.length === 1 ? "moment" : "moments"}</h2>
            </div>
            <Badge variant="outline">Newest first</Badge>
          </div>

          {!isHydrated ? (
            <div className="space-y-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-40 rounded-[1.25rem]" />)}</div>
          ) : filteredEvents.length ? (
            <TimelineList events={filteredEvents} onViewEvidence={setEvidenceEvent} onViewEncounter={setEncounterEvent} />
          ) : (
            <Card className="border-dashed p-8 text-center sm:p-12">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-plum-50 text-plum-600"><ListFilter className="size-5" /></span>
              <h3 className="mt-4 text-base font-semibold">No matching moments yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Choose another filter or add an update in your own words.</p>
              <Button asChild variant="outline" size="sm" className="mt-5"><Link href="/patient/update">Add an update</Link></Button>
            </Card>
          )}
        </div>
      </section>

      <SafetyNotice className="mx-auto mt-2 max-w-2xl border-t pt-5" compact />

      <EvidenceDrawer
        open={Boolean(evidenceEvent)}
        onOpenChange={(open) => { if (!open) setEvidenceEvent(null); }}
        observation={evidenceEvent?.summary ?? ""}
        evidence={evidence}
      />
      <EncounterDetailsSheet
        event={encounterEvent}
        open={Boolean(encounterEvent)}
        onOpenChange={(open) => { if (!open) setEncounterEvent(null); }}
      />
    </main>
  );
}
