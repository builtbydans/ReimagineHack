"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FilePenLine,
  Mic2,
  Pill,
  Sparkles,
} from "lucide-react";
import * as React from "react";

import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { SafetyNotice } from "@/components/shared/safety-notice";
import { SourceBadge, VerificationBadge } from "@/components/shared/source-badge";
import { TimelineList } from "@/components/timeline/timeline-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoData } from "@/components/shared/demo-data-provider";
import { demoPatient, seedEvidenceReferences } from "@/data/seed";
import type { TimelineEvent } from "@/server/types/domain";

const quickActions = [
  {
    href: "/patient/update#speak",
    label: "Record voice",
    hint: "Say it naturally",
    icon: Mic2,
    className: "bg-plum-950 text-white",
  },
  {
    href: "/patient/update#write",
    label: "Write update",
    hint: "Type in your own words",
    icon: FilePenLine,
    className: "border border-plum-100 bg-white text-plum-950",
  },
  {
    href: "/patient/update#medication",
    label: "Medication change",
    hint: "Note a dose or concern",
    icon: Pill,
    className: "border border-amber-100 bg-amber-50/70 text-amber-900",
  },
];

export default function PatientHomePage() {
  const { events, isHydrated } = useDemoData();
  const [evidenceEvent, setEvidenceEvent] = React.useState<TimelineEvent | null>(null);

  const observation = events.find((event) => event.type === "ai_observation");
  const recentEvents = events.filter((event) => event.type !== "ai_observation").slice(0, 3);
  const observationEvidence = observation?.evidenceRefs?.length
    ? observation.evidenceRefs
    : seedEvidenceReferences.slice(0, 7);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-7 sm:py-10 lg:px-8">
      <section className="animate-fade-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-plum-500">Friday, 17 July</p>
            <h1 className="mt-2 text-[clamp(1.75rem,7vw,2.75rem)] font-semibold leading-tight tracking-[-.045em] text-plum-950">
              Good afternoon, Amina.
            </h1>
          </div>
          <Badge variant="patient" className="hidden sm:inline-flex">Your health story</Badge>
        </div>

        <div className="relative mt-7 overflow-hidden rounded-[1.75rem] bg-plum-700 px-5 py-7 text-white shadow-[0_22px_55px_-30px_rgba(42,20,32,.7)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full border-[34px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-20 right-16 size-48 rounded-full bg-plum-400/20 blur-2xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-plum-50">
              <span className="size-1.5 rounded-full bg-sage-300" />
              A quiet place to keep the details
            </span>
            <h2 className="mt-5 text-balance text-2xl font-semibold leading-[1.12] tracking-[-.04em] sm:text-4xl">
              How have you been since your last update?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-plum-100/85 sm:text-base">
              Add anything that feels important. Speak or write naturally — Thread will organise it.
            </p>
            <Button asChild size="lg" className="mt-6 bg-white text-plum-800 shadow-md hover:bg-plum-50">
              <Link href="/patient/update">Add an update <ArrowRight /></Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`group flex min-h-[7.25rem] flex-col justify-between rounded-[1.2rem] p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:p-4 ${action.className}`}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-current/10 sm:size-10">
                  <Icon className="size-4" />
                </span>
                <span className="mt-3 min-w-0 sm:mt-0 sm:flex-1">
                  <span className="block text-[11px] font-semibold leading-tight sm:text-sm">{action.label}</span>
                  <span className="mt-1 hidden text-[11px] opacity-65 sm:block">{action.hint}</span>
                </span>
                <ChevronRight className="hidden size-4 opacity-40 transition-transform group-hover:translate-x-0.5 sm:block" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.11em] text-plum-500">Your continuous story</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">What Thread has noticed</h2>
              </div>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Sparkles className="size-4" /></span>
            </div>

            {isHydrated && observation ? (
              <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 via-white to-plum-50/60">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <SourceBadge sourceKind="ai_organised" />
                    <VerificationBadge />
                  </div>
                  <p className="mt-5 text-lg font-semibold leading-7 tracking-[-.02em] text-plum-950 sm:text-xl sm:leading-8">
                    {observation.summary}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {String(observation.metadata?.evidenceSummary ?? "Based on 5 updates and 2 encounters.")}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-amber-100 bg-white/65 px-5 py-3 sm:px-6">
                  <p className="text-[11px] text-muted-foreground">A pattern to review, not a clinical conclusion.</p>
                  <Button variant="ghost" size="sm" className="px-2 text-plum-700" onClick={() => setEvidenceEvent(observation)}>
                    View evidence <ChevronRight />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-5"><Skeleton className="h-5 w-36" /><Skeleton className="mt-5 h-16 w-full" /><Skeleton className="mt-5 h-9 w-32" /></Card>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-sage-100 bg-sage-50/75 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sage-700 shadow-sm"><CalendarDays className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[.11em] text-sage-700">Next appointment</p>
                  <Badge variant="clinical"><Clock3 /> 7 days</Badge>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-[-.025em]">{demoPatient.nextAppointment?.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">24 July 2026 · {demoPatient.nextAppointment?.organisation}</p>
                <Button asChild variant="outline" size="sm" className="mt-4 border-sage-200 text-sage-800 hover:bg-white">
                  <Link href="/patient/prepare">Prepare for appointment <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.11em] text-plum-500">Latest moments</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">Recent story</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="px-2 text-plum-700">
              <Link href="/patient/timeline">Full timeline <ArrowRight /></Link>
            </Button>
          </div>
          {isHydrated ? <TimelineList events={recentEvents} compact /> : <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-[1.25rem]" />)}</div>}
        </div>
      </section>

      <SafetyNotice className="mx-auto mt-4 max-w-2xl border-t pt-5" compact />

      <EvidenceDrawer
        open={Boolean(evidenceEvent)}
        onOpenChange={(open) => { if (!open) setEvidenceEvent(null); }}
        observation={evidenceEvent?.summary ?? ""}
        evidence={observationEvidence}
      />
    </main>
  );
}
