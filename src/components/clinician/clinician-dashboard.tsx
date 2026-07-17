"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeftRight,
  BedDouble,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  DatabaseZap,
  FileCheck2,
  HeartPulse,
  History,
  Languages,
  Link2,
  LoaderCircle,
  MessageSquareQuote,
  PanelTopOpen,
  Pill,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { demoPatient, seedEvidenceReferences, seedImportedEncounter, seedThreadObservation, seedTimelineEvents } from "@/data/seed";
import { useDemoData } from "@/components/shared/demo-data-provider";
import { ThreadLogo } from "@/components/shared/thread-logo";
import { SafetyNotice } from "@/components/shared/safety-notice";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { EncounterDetailsSheet } from "@/components/timeline/encounter-details-sheet";
import { PainTrendCard } from "@/components/timeline/pain-trend-card";
import { TimelineList } from "@/components/timeline/timeline-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { EvidenceReference, ObservationStatement, TimelineEvent } from "@/server/types/domain";

type EvidenceState = {
  observation: string;
  evidence: EvidenceReference[];
};

type ImportOutcome = "added" | "already_present";
type ImportApiEnvelope = {
  ok: boolean;
  data?: {
    status?: "imported" | "already_imported" | "failed";
    timelineEvent?: TimelineEvent;
  };
};

const concernItems = [
  { label: "Worsening pelvic pain", detail: "8/10 most recently reported", icon: HeartPulse, tone: "text-plum-700 bg-plum-50" },
  { label: "Lower-back pain", detail: "Reported in June and July", icon: Activity, tone: "text-plum-700 bg-plum-50" },
  { label: "Sleep disruption", detail: "Woken during the night", icon: BedDouble, tone: "text-amber-700 bg-amber-50" },
  { label: "Medication-related nausea", detail: "Patient report after naproxen", icon: Pill, tone: "text-amber-700 bg-amber-50" },
  { label: "Work impact", detail: "Left early twice", icon: BriefcaseBusiness, tone: "text-amber-700 bg-amber-50" },
];

const importSteps = [
  "Connecting to external record",
  "Reading encounter details",
  "Matching patient and date",
  "Adding verified source context",
  "Encounter imported",
];

const seededUclhEncounter = seedTimelineEvents.find((event) => event.type === "ae_encounter") ?? null;

const encounterTypeLabels: Partial<Record<TimelineEvent["type"], string>> = {
  ae_encounter: "A&E attendance",
  gp_review: "GP review",
  specialist_review: "Specialist review",
};

function SectionHeading({ icon: Icon, title, subtitle, action }: { icon: typeof Activity; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-plum-50 text-plum-700"><Icon className="size-4" /></span>
        <div><h2 className="text-base font-semibold tracking-[-.02em]">{title}</h2>{subtitle ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}</div>
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f8f6f4] p-3 xl:rounded-none xl:border-l xl:bg-transparent xl:p-0 xl:pl-4 first:xl:border-l-0 first:xl:pl-0">
      <dt className="flex items-start gap-1.5 text-[10px] font-semibold uppercase leading-4 tracking-[.1em] text-muted-foreground"><Icon className="mt-0.5 size-3 shrink-0" />{label}</dt>
      <dd className="mt-1 text-xs font-semibold leading-5 sm:text-sm">{value}</dd>
    </div>
  );
}

export function ClinicianDashboard() {
  const { events, addEvent } = useDemoData();
  const [evidenceState, setEvidenceState] = React.useState<EvidenceState | null>(null);
  const [encounterEvent, setEncounterEvent] = React.useState<TimelineEvent | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState(-1);
  const [importComplete, setImportComplete] = React.useState(false);
  const [importOutcome, setImportOutcome] = React.useState<ImportOutcome | null>(null);
  const [importPersisted, setImportPersisted] = React.useState<boolean | null>(null);

  const uclhEncounter = events.find((event) => event.type === "ae_encounter" && event.organisation?.includes("University College London")) ?? null;
  const encounterForDetails = uclhEncounter ?? seededUclhEncounter;
  const lastPatientUpdate = events.find((event) => event.sourceKind === "patient_reported");
  const lastHealthcareEncounter = events.find((event) => event.type === "ae_encounter" || event.type === "gp_review" || event.type === "specialist_review");
  const lastHealthcareEncounterLabel = lastHealthcareEncounter
    ? `${encounterTypeLabels[lastHealthcareEncounter.type] ?? "Healthcare encounter"} · ${format(new Date(lastHealthcareEncounter.recordedAt), "d MMM yyyy")}`
    : "No encounter recorded";

  const openStatementEvidence = React.useCallback((statement: ObservationStatement) => {
    const references = seedEvidenceReferences.filter((reference) => statement.evidenceIds.includes(reference.id));
    setEvidenceState({ observation: statement.text, evidence: references });
  }, []);

  const openEventEvidence = React.useCallback((event: TimelineEvent) => {
    setEvidenceState({ observation: event.summary, evidence: event.evidenceRefs ?? [] });
  }, []);

  const runImport = React.useCallback(() => {
    setImportOpen(true);
    setImportComplete(false);
    setImportOutcome(null);
    setImportPersisted(null);
    setImportStep(0);
  }, []);

  React.useEffect(() => {
    if (!importOpen || importStep < 0 || importStep >= importSteps.length - 1) return;
    const timeout = window.setTimeout(() => setImportStep((step) => step + 1), 650);
    return () => window.clearTimeout(timeout);
  }, [importOpen, importStep]);

  React.useEffect(() => {
    if (!importOpen || importStep !== importSteps.length - 1 || importComplete) return;
    const timeout = window.setTimeout(() => {
      const finaliseImport = async () => {
        const alreadyPresent = Boolean(uclhEncounter);
        let importedEvent = seededUclhEncounter;
        let persisted = false;
        let repositoryAlreadyImported = false;
        try {
          const response = await fetch("/api/encounters/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId: demoPatient.id,
              sourceReference: seedImportedEncounter.sourceReference,
              simulate: true,
            }),
          });
          const body = await response.json() as ImportApiEnvelope;
          if (!response.ok || !body.ok || !body.data) throw new Error("Encounter import failed");
          importedEvent = body.data.timelineEvent ?? importedEvent;
          repositoryAlreadyImported = body.data.status === "already_imported";
          persisted = true;
        } catch {
          persisted = false;
        }

        if (!alreadyPresent && importedEvent) addEvent(importedEvent);
        const outcome = alreadyPresent || repositoryAlreadyImported ? "already_present" : "added";
        setImportOutcome(outcome);
        setImportPersisted(persisted);
        setImportComplete(true);
        toast.success(
          outcome === "already_present"
            ? "Synthetic UCLH encounter confirmed in Amina’s story"
            : "Synthetic UCLH encounter added to Amina’s story",
          {
            description: persisted
              ? "The configured Thread repository recorded the simulated import."
              : "The data service was unavailable, so the demonstration continued in this browser only.",
          },
        );
      };
      void finaliseImport();
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [addEvent, importComplete, importOpen, importStep, uclhEncounter]);

  return (
    <div className="min-h-dvh bg-[#f4f2ef] text-[#251c21]">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1500px] items-center gap-6 px-5 lg:px-8">
          <ThreadLogo href="/clinician" />
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <nav aria-label="Clinician breadcrumb" className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><PanelTopOpen className="size-3.5" />Clinician context view <ChevronRight className="size-3" /> <span aria-current="page" className="font-semibold text-foreground">Amina Khan</span></nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/patient"><ArrowLeftRight /> Patient view</Link></Button>
            <Button asChild variant="ghost" size="icon" className="sm:hidden"><Link href="/patient" aria-label="Switch to patient view"><ArrowLeftRight /></Link></Button>
            <Avatar className="size-9"><AvatarFallback className="bg-sage-100 text-sage-700">DR</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="rounded-[1.5rem] border bg-white px-5 py-5 shadow-card lg:px-6" aria-labelledby="patient-name">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14 ring-4 ring-plum-50"><AvatarFallback className="bg-plum-100 text-base text-plum-700">AK</AvatarFallback></Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 id="patient-name" className="text-2xl font-semibold tracking-[-.04em]">{demoPatient.name}</h1><Badge variant="outline">Age {demoPatient.age}</Badge></div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Stethoscope className="size-3.5" />{demoPatient.condition}</span><span className="flex items-center gap-1.5"><Languages className="size-3.5" />Preferred language: {demoPatient.preferredLanguage}</span></div>
              </div>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-2 border-t pt-5 sm:grid-cols-4 xl:ml-auto xl:max-w-3xl xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <Metric label="Upcoming review" value={demoPatient.nextAppointment ? format(new Date(demoPatient.nextAppointment.date), "d MMM yyyy") : "Not scheduled"} icon={CalendarClock} />
              <Metric label="Last patient update" value={lastPatientUpdate ? format(new Date(lastPatientUpdate.recordedAt), "d MMM yyyy") : "No update recorded"} icon={Clock3} />
              <Metric label="Last healthcare encounter" value={lastHealthcareEncounterLabel} icon={ClipboardCheck} />
              <Metric label="Context sources" value="Patient + imported" icon={Link2} />
            </dl>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            <Badge variant="outline"><UserRound /> Synthetic demo patient</Badge>
            <Badge variant="clinical"><FileCheck2 /> Patient-reported + imported context</Badge>
            <Badge variant="warning"><ShieldAlert /> Not an emergency monitoring service</Badge>
          </div>
        </section>

        <section className="relative mt-5 overflow-hidden rounded-[1.65rem] bg-plum-950 px-5 py-6 text-white shadow-soft sm:px-7 lg:px-8" aria-labelledby="changed-heading">
          <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-plum-700/35 blur-2xl" />
          <div className="relative grid gap-7 xl:grid-cols-[.62fr_1.38fr] xl:gap-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-plum-200"><Sparkles className="size-4" />Thread overview</div>
              <h2 id="changed-heading" className="mt-3 max-w-sm text-3xl font-semibold leading-[1.05] tracking-[-.045em]">What has changed since the last review?</h2>
              <div className="mt-4 flex flex-wrap gap-2"><Badge className="border border-plum-500 bg-plum-800">AI-organised</Badge><Badge className="border border-white/15 bg-white/10"><ShieldAlert /> Not clinically verified</Badge></div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2" aria-label="Changes since the last review">
              {seedThreadObservation.statements.slice(0, 4).map((statement, index) => (
                <li key={statement.id}>
                  <button type="button" onClick={() => openStatementEvidence(statement)} className="group flex h-full min-h-24 w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-left transition-colors hover:bg-white/[.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-200 focus-visible:ring-offset-2 focus-visible:ring-offset-plum-950">
                    <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-plum-700 text-[10px] font-bold text-plum-100">0{index + 1}</span>
                    <span className="flex-1"><span className="block text-sm font-medium leading-5 text-white">{statement.text}</span><span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-plum-200">{statement.evidenceCount} evidence {statement.evidenceCount === 1 ? "item" : "items"}<ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" /></span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(21rem,.75fr)]">
          <div className="min-w-0 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader><SectionHeading icon={CircleAlert} title="Current concerns" subtitle="Reported across recent updates" /></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {concernItems.map((item) => {
                      const Icon = item.icon;
                      return <li key={item.label} className="flex items-center gap-3 rounded-xl px-2 py-2.5"><span className={cn("flex size-8 items-center justify-center rounded-lg", item.tone)}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-sm font-semibold">{item.label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p></div></li>;
                    })}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><SectionHeading icon={ClipboardCheck} title="Patient priorities" subtitle="Selected for the upcoming review" /></CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {["Better symptom control", "Medication side effects", "Ability to remain at work"].map((priority, index) => (
                      <li key={priority} className="flex items-center gap-3 rounded-xl border bg-[#fbfaf8] p-3"><span className="flex size-7 items-center justify-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">{index + 1}</span><span className="text-sm font-semibold">{priority}</span><CheckCircle2 className="ml-auto size-4 text-sage-600" /></li>
                    ))}
                  </ol>
                  <Button asChild variant="soft" size="sm" className="mt-4 w-full"><Link href="/patient/prepare">Open appointment brief <ChevronRight /></Link></Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <PainTrendCard />
              <Card className="overflow-hidden bg-plum-50/55">
                <CardHeader><SectionHeading icon={MessageSquareQuote} title="Patient voice" subtitle="Translated from an Urdu voice update" /></CardHeader>
                <CardContent>
                  <blockquote className="text-balance text-xl font-medium leading-8 tracking-[-.025em] text-plum-950">“I could not stand for long at work and had to leave early.”</blockquote>
                  <div className="mt-5 rounded-xl border border-plum-100 bg-white/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-plum-600">Original · Roman Urdu</p>
                    <p className="mt-1.5 text-xs italic leading-5 text-muted-foreground">Main kaam par zyada dair khari nahi reh saki aur jaldi ghar aana para.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3 px-1 text-plum-700" onClick={() => openStatementEvidence(seedThreadObservation.statements[3])}>View supporting evidence <ChevronRight /></Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <SectionHeading icon={History} title="Longitudinal health story" subtitle="Patient-reported updates, encounters and organised context in one view" action={<Button asChild variant="outline" size="sm"><Link href="/patient/timeline">Full timeline <ChevronRight /></Link></Button>} />
              </CardHeader>
              <CardContent><TimelineList events={events.slice(0, 8)} compact onViewEvidence={openEventEvidence} onViewEncounter={setEncounterEvent} /></CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card>
              <CardHeader><SectionHeading icon={Pill} title="Medication context" subtitle="Reported use and effects" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between"><p className="font-semibold">Naproxen</p><Badge variant="outline">Prescribed 28 May</Badge></div>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">Reported effect</dt><dd className="text-right font-medium">Partial relief</dd></div>
                    <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">Reported side effect</dt><dd className="text-right font-medium text-amber-700">Nausea</dd></div>
                    <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">Later use</dt><dd className="text-right font-medium">One avoided dose</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900"><ShieldAlert className="mr-1 inline size-3.5" />Thread provides no recommendation to start, stop or change medication.</div>
                <Button variant="ghost" size="sm" className="w-full text-plum-700" onClick={() => openStatementEvidence(seedThreadObservation.statements[2])}>View 3 supporting items <ChevronRight /></Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><SectionHeading icon={BriefcaseBusiness} title="Functional impact" subtitle="How symptoms affect daily life" /></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                {[{ label: "Left work early", value: "2 recorded occasions", icon: BriefcaseBusiness }, { label: "Difficulty standing", value: "Reported at work", icon: Activity }, { label: "Woken overnight", value: "10 July update", icon: BedDouble }].map((item) => {
                  const Icon = item.icon;
                  return <li key={item.label} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"><Icon className="size-4 text-plum-600" /><div><p className="text-xs font-semibold">{item.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.value}</p></div></li>;
                })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><SectionHeading icon={DatabaseZap} title="Encounter import" subtitle="External source context demonstration" /></CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-sage-200 bg-sage-50 p-4">
                  <div className="flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-white text-sage-700 shadow-sm"><FileCheck2 className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">UCLH Emergency Department</p>{uclhEncounter ? <Badge variant="clinical">In timeline</Badge> : null}</div><p className="mt-1 text-[11px] leading-4 text-sage-800/75">17 May 2026 · Synthetic discharge record</p></div></div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" className="min-w-0 px-2" disabled={!encounterForDetails} onClick={() => setEncounterEvent(encounterForDetails)}>View record</Button><Button size="sm" className="min-w-0 px-2" onClick={runImport}><RefreshCw /> Import encounter</Button></div>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Demonstration of an imported external encounter record. No direct NHS connectivity is claimed.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><SectionHeading icon={History} title="Encounter history" /></CardHeader>
              <CardContent>
                <ol className="space-y-0">
                  {[{ date: "17 May", label: "A&E attendance", org: "UCLH", interactive: true }, { date: "28 May", label: "GP follow-up", org: "Bloomsbury Surgery" }, { date: "4 Jun", label: "GP review", org: "Bloomsbury Surgery" }, { date: "4 Jul", label: "Referral confirmed", org: "Gynaecology · UCLH" }, { date: "24 Jul", label: "Specialist review", org: "Upcoming · UCLH" }].map((item, index, history) => (
                    <li key={`${item.date}-${item.label}`} className="relative grid grid-cols-[3.2rem_1fr] gap-3 pb-4 last:pb-0">
                      <span className="relative z-10 h-fit rounded-lg bg-plum-50 py-1.5 text-center text-[10px] font-bold text-plum-700">{item.date}</span>
                      {item.interactive ? <button type="button" disabled={!encounterForDetails} onClick={() => setEncounterEvent(encounterForDetails)} className="group text-left"><span className="block text-xs font-semibold group-hover:text-plum-700">{item.label}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{item.org} · View record</span></button> : <span><span className="block text-xs font-semibold">{item.label}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{item.org}</span></span>}
                      {index < history.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-[25px] top-7 w-px bg-plum-100" /> : null}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <SafetyNotice className="px-2" />
          </aside>
        </div>
      </main>

      <EvidenceDrawer open={Boolean(evidenceState)} onOpenChange={(open) => !open && setEvidenceState(null)} observation={evidenceState?.observation ?? ""} evidence={evidenceState?.evidence ?? []} />
      <EncounterDetailsSheet event={encounterEvent} open={Boolean(encounterEvent)} onOpenChange={(open) => !open && setEncounterEvent(null)} />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent aria-busy={!importComplete} className="max-w-md">
          <DialogHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700"><DatabaseZap className="size-5" /></div>
            <DialogTitle>{importComplete ? "Encounter imported" : "Importing encounter context"}</DialogTitle>
            <DialogDescription>Demonstration flow for a synthetic UCLH external record.</DialogDescription>
          </DialogHeader>
          <Progress aria-label="Encounter import progress" value={Math.max(8, ((importStep + 1) / importSteps.length) * 100)} className="my-3" />
          <p className="sr-only" role="status">{importComplete ? "Encounter import complete" : importStep >= 0 ? `Import step ${importStep + 1} of ${importSteps.length}: ${importSteps[importStep]}` : "Preparing encounter import"}</p>
          <ol className="space-y-2">
            {importSteps.map((step, index) => {
              const complete = importStep > index || (importComplete && importStep === index);
              const active = importStep === index && !importComplete;
              return (
                <li key={step} aria-current={active ? "step" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-colors", active && "bg-plum-50 text-plum-900", complete ? "text-sage-700" : "text-muted-foreground")}>
                  {complete ? <CheckCircle2 className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin text-plum-600" /> : <span className="size-4 rounded-full border" />}
                  <span className={cn((complete || active) && "font-semibold")}>{step}</span>
                </li>
              );
            })}
          </ol>
          {importComplete ? (
            <div role="status" className="mt-3 rounded-xl bg-sage-50 p-3 text-xs leading-5 text-sage-800"><Check className="mr-1 inline size-3.5" />{importOutcome === "added" ? "The encounter was added to Amina’s timeline" : "The existing timeline encounter was confirmed"} with its source and synthetic status clearly labelled. {importPersisted ? "The repository recorded this demo state." : "Repository unavailable; browser demo state only."}</div>
          ) : null}
          <Button className="mt-3 w-full" disabled={!importComplete} onClick={() => setImportOpen(false)}>{importComplete ? "Done" : "Importing…"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
