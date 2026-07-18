"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DatabaseZap,
  Eye,
  FileCheck2,
  FlaskConical,
  History,
  Languages,
  LoaderCircle,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import {
  demoPatient,
  EVIDENCE_IDS,
  seedAppointmentBrief,
  seedEvidenceReferences,
  seedImportedEncounter,
  seedThreadObservation,
  seedTimelineEvents,
} from "@/data/seed";
import { useDemoData } from "@/components/shared/demo-data-provider";
import { SourceBadge } from "@/components/shared/source-badge";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { AskThreadPanel } from "@/components/clinician/ask-thread-panel";
import {
  ClinicianHeader,
  type ClinicianMode,
} from "@/components/clinician/clinician-header";
import { EncounterDetailsSheet } from "@/components/timeline/encounter-details-sheet";
import { TimelineList } from "@/components/timeline/timeline-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EvidenceReference, TimelineEvent } from "@/server/types/domain";

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

const importSteps = [
  "Connecting to external record",
  "Reading encounter details",
  "Matching patient and date",
  "Adding verified source context",
  "Encounter imported",
];

const seededUclhEncounter = seedTimelineEvents.find((event) => event.type === "ae_encounter") ?? null;

function getEvidence(evidenceIds: readonly string[]) {
  const ids = new Set(evidenceIds);
  return seedEvidenceReferences.filter((reference) => ids.has(reference.id));
}

function PatientHeader({ events }: { events: TimelineEvent[] }) {
  const lastGpEncounter = events.find((event) => event.type === "gp_review");
  const nextAppointment = demoPatient.nextAppointment;

  return (
    <section className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center" aria-labelledby="patient-name">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-12 ring-4 ring-plum-50"><AvatarFallback className="bg-plum-100 text-sm font-semibold text-plum-700">AK</AvatarFallback></Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 id="patient-name" className="text-2xl font-semibold tracking-[-.04em]">{demoPatient.name}</h1>
            <span className="text-sm text-muted-foreground">Age {demoPatient.age}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-plum-800"><Stethoscope className="size-3.5" />{demoPatient.condition}</p>
        </div>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 md:ml-auto md:max-w-2xl md:border-l md:pl-6">
        <div>
          <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground"><Clock3 className="size-3" />Last GP encounter</dt>
          <dd className="mt-1 text-sm font-semibold">{lastGpEncounter ? format(new Date(lastGpEncounter.recordedAt), "d MMM yyyy") : "Not recorded"}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground"><CalendarClock className="size-3" />Upcoming appointment</dt>
          <dd className="mt-1 text-sm font-semibold">{nextAppointment ? `Booked · ${format(new Date(nextAppointment.date), "d MMM yyyy")}` : "Not scheduled"}</dd>
        </div>
      </dl>
    </section>
  );
}

function PatientContextPanel({ openEvidence, openEncounter }: {
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
  openEncounter: () => void;
}) {
  const allSummaryEvidence = seedAppointmentBrief.evidenceIds;

  return (
    <aside className="rounded-[1.35rem] bg-white px-5 py-6 shadow-card xl:sticky xl:top-20" aria-labelledby="patient-context-heading">
      <section className="border-b pb-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 ring-4 ring-plum-50">
            <AvatarFallback className="bg-plum-100 text-sm font-semibold text-plum-700">AK</AvatarFallback>
          </Avatar>
          <div>
            <h2 id="patient-context-heading" className="text-lg font-semibold tracking-[-.025em]">Amina Khan</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Age 32 · Endometriosis</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Preferred language</dt>
            <dd className="mt-1 text-xs font-semibold">Urdu</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Next appointment</dt>
            <dd className="mt-1 text-xs font-semibold">Today, 12:30</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Last GP encounter</dt>
            <dd className="mt-1 text-xs font-semibold">4 June 2026</dd>
          </div>
        </dl>
      </section>

      <section className="border-b py-5" aria-labelledby="key-context-heading">
        <h3 id="key-context-heading" className="text-xs font-semibold uppercase tracking-[.11em] text-muted-foreground">Key context</h3>
        <dl className="mt-2 divide-y">
          {[
            ["Current pain", "8/10 · pelvis and lower back"],
            ["Sleep", "Regularly interrupted"],
            ["Medication", "Naproxen · partial relief · nausea reported"],
            ["Work impact", "Left early twice this month"],
          ].map(([label, value]) => (
            <div key={label} className="py-3 first:pt-2 last:pb-0">
              <dt className="text-[10px] font-medium text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xs font-semibold leading-5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-b py-5" aria-labelledby="recent-care-heading">
        <div className="flex items-center justify-between gap-3">
          <h3 id="recent-care-heading" className="text-xs font-semibold uppercase tracking-[.11em] text-muted-foreground">Recent care</h3>
          <button type="button" onClick={openEncounter} className="text-[10px] font-semibold text-plum-700 hover:underline">View record</button>
        </div>
        <ol className="mt-3 space-y-4">
          <li>
            <p className="text-xs font-semibold">17 May · UCLH A&amp;E</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Severe pelvic pain · discharged with GP follow-up advice</p>
          </li>
          <li>
            <p className="text-xs font-semibold">24 July · Gynaecology</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Appointment booked at UCLH</p>
          </li>
        </ol>
      </section>

      <section className="pt-5" aria-labelledby="evidence-overview-heading">
        <p className="text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground">Evidence overview</p>
        <h3 id="evidence-overview-heading" className="mt-1 text-sm font-semibold">17 supporting records</h3>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">12 patient updates · 3 medication records · 2 clinical encounters</p>
        <div className="mt-4 grid gap-2">
          <Button variant="outline" size="sm" onClick={() => openEvidence("Pre-appointment briefing for Amina Khan", allSummaryEvidence)}><Eye /> View evidence</Button>
          <Button asChild variant="ghost" size="sm"><Link href="/clinician/investigation">Open Clinical Investigation <ChevronRight /></Link></Button>
        </div>
      </section>
    </aside>
  );
}

function AppointmentSummary({ openEvidence, openEncounter }: {
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
  openEncounter: () => void;
}) {
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground">
        <Link href="/clinician">← Back to today’s appointments</Link>
      </Button>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] xl:gap-7">
        <AskThreadPanel patientId={demoPatient.id} openEvidence={openEvidence} />
        <PatientContextPanel openEvidence={openEvidence} openEncounter={openEncounter} />
      </div>
    </main>
  );
}

function InvestigationSectionHeading({ icon: Icon, title, subtitle, action }: {
  icon: typeof Search;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-plum-700"><Icon className="size-4" /></span>
        <div><h2 className="text-base font-semibold tracking-[-.02em]">{title}</h2>{subtitle ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p> : null}</div>
      </div>
      {action}
    </div>
  );
}

function ClinicalInvestigation({ events, uclhEncounter, encounterForDetails, openEvidence, setEncounterEvent, runImport }: {
  events: TimelineEvent[];
  uclhEncounter: TimelineEvent | null;
  encounterForDetails: TimelineEvent | null;
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
  setEncounterEvent: (event: TimelineEvent | null) => void;
  runImport: () => void;
}) {
  const medicationEvents = events.filter((event) => event.medicationDetails).slice(0, 4);
  const urduUpdate = events.find((event) => event.language?.includes("Urdu"));

  return (
    <main className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-[1.25rem] border bg-white px-5 py-4 shadow-card sm:px-6">
        <PatientHeader events={events} />
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-plum-600"><Search className="size-3" />Inspectable evidence layer</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-.035em]">Clinical Investigation</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Explore the source updates, imported records and evidence Thread used to organise Amina’s appointment summary.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="sm:ml-auto"><Link href="/clinician/appointment-summary">Back to appointment summary</Link></Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.48fr)_minmax(20rem,.72fr)]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader><InvestigationSectionHeading icon={Search} title="AI-organised observations" subtitle="Select an observation to inspect the linked evidence" /></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {seedThreadObservation.statements.map((statement) => (
                  <li key={statement.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-plum-50 text-[10px] font-bold text-plum-700">{statement.evidenceCount}</span>
                    <span className="flex-1 text-sm leading-5">{statement.text}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-plum-700" onClick={() => openEvidence(statement.text, statement.evidenceIds)}>Evidence <ChevronRight /></Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><InvestigationSectionHeading icon={History} title="Longitudinal timeline" subtitle="Patient updates, healthcare encounters and source timestamps" /></CardHeader>
            <CardContent><TimelineList events={events} onViewEvidence={(event) => openEvidence(event.summary, event.evidenceRefs?.map((item) => item.id) ?? [])} onViewEncounter={setEncounterEvent} /></CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          {urduUpdate ? (
            <Card>
              <CardHeader><InvestigationSectionHeading icon={Languages} title="Patient voice" subtitle={format(new Date(urduUpdate.recordedAt), "d MMM yyyy, HH:mm")} /></CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm leading-6">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-plum-600">Original · Roman Urdu</p><p className="mt-1.5 italic">“{urduUpdate.originalText}”</p></div>
                  <div className="border-t pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">English translation</p><p className="mt-1.5">{urduUpdate.translatedText}</p></div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 px-1 text-plum-700" onClick={() => openEvidence("Amina reported that pain affected her ability to stand and work.", [EVIDENCE_IDS.voicePain, EVIDENCE_IDS.voiceWork])}>View source evidence <ChevronRight /></Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><InvestigationSectionHeading icon={Pill} title="Medication history" subtitle="Reported use, effect and side effects" /></CardHeader>
            <CardContent>
              <ol className="divide-y">
                {medicationEvents.map((event) => (
                  <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{event.medicationDetails?.medicationName}</p><time className="text-[10px] text-muted-foreground">{format(new Date(event.recordedAt), "d MMM yyyy")}</time></div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.summary}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><InvestigationSectionHeading icon={FlaskConical} title="Imported A&E encounter" subtitle="Observations, blood results and source record" /></CardHeader>
            <CardContent>
              <div className="rounded-xl bg-sage-50 p-4">
                <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-4 shrink-0 text-sage-700" /><div><p className="text-sm font-semibold">UCLH Emergency Department</p><p className="mt-1 text-xs text-sage-800/75">17 May 2026 · Synthetic discharge record</p></div></div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" disabled={!encounterForDetails} onClick={() => setEncounterEvent(encounterForDetails)} className="flex-1">View record</Button>
                  <Button size="sm" onClick={runImport} className="flex-1"><RefreshCw />{uclhEncounter ? "Re-import" : "Import"}</Button>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Synthetic external-record demonstration; no direct NHS connection is claimed.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><InvestigationSectionHeading icon={DatabaseZap} title="Source provenance" /></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3"><SourceBadge sourceKind="patient_reported" compact /><span className="text-xs text-muted-foreground">12 updates</span></div>
              <div className="flex items-center justify-between gap-3"><SourceBadge sourceKind="imported_clinical_record" compact /><span className="text-xs text-muted-foreground">2 encounters</span></div>
              <div className="flex items-center justify-between gap-3"><SourceBadge sourceKind="ai_organised" compact /><span className="text-xs text-muted-foreground">Generated 17 Jul, 14:00</span></div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

export function ClinicianDashboard({ mode = "summary" }: { mode?: Exclude<ClinicianMode, "today"> }) {
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

  const openEvidence = React.useCallback((observation: string, evidenceIds: readonly string[]) => {
    setEvidenceState({ observation, evidence: getEvidence(evidenceIds) });
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
        toast.success(outcome === "already_present" ? "Synthetic UCLH encounter confirmed" : "Synthetic UCLH encounter added", {
          description: persisted ? "The configured repository recorded the simulated import." : "The demonstration continued in this browser only.",
        });
      };
      void finaliseImport();
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [addEvent, importComplete, importOpen, importStep, uclhEncounter]);

  return (
    <div className="min-h-dvh bg-[#f4f2ef] text-[#251c21]">
      <ClinicianHeader mode={mode} />
      {mode === "summary" ? (
        <AppointmentSummary openEvidence={openEvidence} openEncounter={() => setEncounterEvent(encounterForDetails)} />
      ) : (
        <ClinicalInvestigation
          events={events}
          uclhEncounter={uclhEncounter}
          encounterForDetails={encounterForDetails}
          openEvidence={openEvidence}
          setEncounterEvent={setEncounterEvent}
          runImport={runImport}
        />
      )}

      <EvidenceDrawer
        open={Boolean(evidenceState)}
        onOpenChange={(open) => !open && setEvidenceState(null)}
        observation={evidenceState?.observation ?? ""}
        evidence={evidenceState?.evidence ?? []}
      />
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
          {importComplete ? <div role="status" className="mt-3 rounded-xl bg-sage-50 p-3 text-xs leading-5 text-sage-800"><Check className="mr-1 inline size-3.5" />{importOutcome === "added" ? "The encounter was added to Amina’s timeline" : "The existing timeline encounter was confirmed"}. {importPersisted ? "The repository recorded this demo state." : "Repository unavailable; browser demo state only."}</div> : null}
          <Button className="mt-3 w-full" disabled={!importComplete} onClick={() => setImportOpen(false)}>{importComplete ? "Done" : "Importing…"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
