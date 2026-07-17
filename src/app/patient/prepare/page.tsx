"use client";

import { format } from "date-fns";
import {
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Link2,
  LoaderCircle,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { SafetyNotice } from "@/components/shared/safety-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { seedAppointmentBrief } from "@/data/seed/appointment-brief";
import { seedEvidenceReferences } from "@/data/seed/evidence";
import { demoPatient } from "@/data/seed/patient";
import { cn } from "@/lib/utils";
import type {
  AppointmentBriefSectionKey,
  EvidenceReference,
} from "@/server/types/domain";

type BriefStatus = "draft" | "ready" | "shared";

type PreviewItem = {
  id: string;
  text: string;
  evidenceIds: string[];
};

type DrawerState = {
  observation: string;
  evidence: EvidenceReference[];
  title?: string;
};

function evidenceFor(sectionKey: AppointmentBriefSectionKey, itemIndex: number) {
  return (
    seedAppointmentBrief.sections.find((section) => section.key === sectionKey)
      ?.items[itemIndex]?.evidenceIds ?? []
  );
}

const priorityOptions = [
  {
    label: "Better pain control",
    description: "Understand what could help when pain is at its worst.",
    briefText: "Discuss pain management and options for better pain control.",
    evidenceIds: evidenceFor("patient_priorities", 0),
  },
  {
    label: "Medication side effects",
    description: "Talk about nausea and whether alternatives are available.",
    briefText: "Discuss medication-related nausea and possible alternatives.",
    evidenceIds: evidenceFor("patient_priorities", 1),
  },
  {
    label: "Impact on work",
    description: "Explain how symptoms are affecting working days.",
    briefText: "Discuss the impact of symptoms on work.",
    evidenceIds: evidenceFor("patient_priorities", 2),
  },
  {
    label: "Interrupted sleep",
    description: "Share how symptoms have interrupted sleep.",
    briefText: "Discuss how pain and other symptoms are affecting sleep.",
    evidenceIds: evidenceFor("changes_since_last_review", 1),
  },
  {
    label: "Increasing pain",
    description: "Ask what might explain the recent change in pain.",
    briefText: "Ask why pain has been increasing across recent cycles.",
    evidenceIds: evidenceFor("patient_questions", 1),
  },
  {
    label: "Understanding next steps",
    description: "Leave with a clear plan for what happens next.",
    briefText: "Agree the next steps and follow-up plan for care.",
    evidenceIds: evidenceFor("patient_questions", 2),
  },
] as const;

const evidenceById = new Map(
  seedEvidenceReferences.map((reference) => [reference.id, reference]),
);

function EvidenceLink({
  item,
  onOpen,
}: {
  item: PreviewItem;
  onOpen: (item: PreviewItem) => void;
}) {
  const count = item.evidenceIds.length;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group mt-2.5 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-plum-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-plum-600 shadow-sm transition-colors hover:border-plum-300 hover:bg-plum-50 hover:text-plum-800"
      aria-label={`View ${count} supporting ${count === 1 ? "source" : "sources"} for: ${item.text}`}
    >
      <Link2 className="size-3.5 transition-transform group-hover:-rotate-6" />
      {count} {count === 1 ? "source" : "sources"}
    </button>
  );
}

function BriefSection({
  title,
  sectionNumber,
  items,
  onOpenEvidence,
}: {
  title: string;
  sectionNumber: number;
  items: PreviewItem[];
  onOpenEvidence: (item: PreviewItem) => void;
}) {
  return (
    <section className="grid gap-3 border-t border-plum-100 py-5 first:border-t-0 first:pt-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 sm:py-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-plum-400">
          {String(sectionNumber).padStart(2, "0")}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-5 text-plum-950">
          {title}
        </h3>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="relative pl-4 text-sm leading-6 text-[#4f444a]">
            <span className="absolute left-0 top-[.58rem] size-1.5 rounded-full bg-plum-400" />
            <p>{item.text}</p>
            <EvidenceLink item={item} onOpen={onOpenEvidence} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AppointmentPreparationPage() {
  const appointment = seedAppointmentBrief.appointment;
  const appointmentDate = new Date(appointment.date);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    seedAppointmentBrief.patientPriorities,
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [status, setStatus] = useState<BriefStatus>("draft");
  const [exported, setExported] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const selectedPriorityItems = useMemo<PreviewItem[]>(
    () =>
      priorityOptions
        .filter((option) => selectedPriorities.includes(option.label))
        .map((option, index) => ({
          id: `selected-priority-${index}`,
          text: option.briefText,
          evidenceIds: [...option.evidenceIds],
        })),
    [selectedPriorities],
  );

  const resetReview = () => {
    setReviewed(false);
    setStatus("draft");
    setExported(false);
  };

  const togglePriority = (label: string) => {
    setSelectedPriorities((current) =>
      current.includes(label)
        ? current.filter((priority) => priority !== label)
        : [...current, label],
    );
    resetReview();
  };

  const openEvidence = (item: PreviewItem) => {
    const evidence = item.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter((reference): reference is EvidenceReference => Boolean(reference));

    setDrawer({ observation: item.text, evidence });
  };

  const markReady = async () => {
    if (!reviewed) {
      toast.error("Review your brief before marking it ready.");
      return;
    }

    if (!selectedPriorities.length) {
      toast.error("Choose at least one priority for your appointment brief.");
      return;
    }

    setIsPersisting(true);
    let persisted = false;
    try {
      const generated = await fetch("/api/appointment-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: demoPatient.id,
          priorities: selectedPriorities,
          ...(additionalContext.trim()
            ? { additionalContext: additionalContext.trim() }
            : {}),
        }),
      });
      if (!generated.ok) throw new Error("Brief generation failed");
      const ready = await fetch("/api/appointment-brief", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: demoPatient.id, status: "ready" }),
      });
      if (!ready.ok) throw new Error("Brief status update failed");
      persisted = true;
    } catch {
      persisted = false;
    }
    setStatus("ready");
    setIsPersisting(false);
    toast.success("Your appointment brief is ready", {
      description: persisted
        ? "Saved to Thread. Nothing has been shared yet; you remain in control."
        : "The data service was unavailable, so this demo brief remains ready in your browser only.",
    });
  };

  const shareBrief = async () => {
    if (status === "draft") return;
    setIsPersisting(true);
    let persisted = false;
    try {
      const response = await fetch("/api/appointment-brief", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: demoPatient.id, status: "shared" }),
      });
      if (!response.ok) throw new Error("Brief status update failed");
      persisted = true;
    } catch {
      persisted = false;
    }
    setStatus("shared");
    setIsPersisting(false);
    toast.success("Brief shared — demo complete", {
      description: persisted
        ? "Demo status saved. In the live product, Amina would choose who receives it."
        : "The data service was unavailable; no external message was sent and the demo state remains local.",
    });
  };

  const exportBrief = () => {
    if (status === "draft") return;
    setExported(true);
    toast.success("Brief exported", {
      description: "A secure PDF would download in the live product.",
    });
  };

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_80%_0%,rgba(225,203,216,.55),transparent_48%)]" />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-7 sm:pt-10 lg:px-8 lg:pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.15em] text-plum-500">
              Appointment preparation
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-.045em] text-plum-950 sm:text-4xl">
              Walk in with what matters.
            </h1>
          </div>
          <Badge
            variant={status === "shared" ? "clinical" : status === "ready" ? "patient" : "outline"}
            className="bg-white/80 px-3 py-1.5"
          >
            {status === "shared" ? (
              <CheckCircle2 />
            ) : status === "ready" ? (
              <FileCheck2 />
            ) : (
              <FileText />
            )}
            {status === "shared" ? "Shared" : status === "ready" ? "Ready to share" : "Draft"}
          </Badge>
        </div>

        <section className="relative overflow-hidden rounded-[1.65rem] bg-plum-950 px-5 py-5 text-white shadow-soft sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border-[42px] border-white/[.035]" />
          <div className="relative grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6">
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3 pr-4">
              <div className="flex size-14 flex-col items-center justify-center rounded-xl bg-[#f7f1ed] text-plum-950 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-plum-500">
                  {format(appointmentDate, "MMM")}
                </span>
                <span className="-mt-0.5 text-2xl font-semibold leading-none">
                  {format(appointmentDate, "d")}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-plum-200">
                  In 7 days
                </p>
                <p className="mt-1 text-sm font-semibold">{format(appointmentDate, "EEEE")}</p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/10 bg-white/10 text-plum-100">
                  <CalendarDays /> Upcoming
                </Badge>
                <span className="text-xs text-plum-200">{appointment.appointmentType}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-.025em] sm:text-2xl">
                {appointment.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2 text-xs leading-5 text-plum-100/75 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-3.5 text-plum-300" />
                  <time dateTime={appointment.date}>
                    {format(appointmentDate, "d MMMM yyyy")} at {format(appointmentDate, "h:mm a")}
                  </time>
                </span>
                <span className="inline-flex items-start gap-2">
                  <Building2 className="mt-0.5 size-3.5 shrink-0 text-plum-300" />
                  {appointment.organisation}
                </span>
                {appointment.location ? (
                  <span className="inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-plum-300" />
                    {appointment.location}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(18rem,.78fr)_minmax(0,1.35fr)] lg:gap-8">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-[1.4rem] border bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-plum-500">
                    Step 1
                  </p>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-[-.02em] text-plum-950">
                    What matters most?
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Choose the topics you want to make time for.
                  </p>
                </div>
                <span className="rounded-full bg-plum-50 px-2.5 py-1 text-[11px] font-semibold text-plum-600">
                  {selectedPriorities.length} selected
                </span>
              </div>

              <div className="mt-5 grid gap-2.5" role="group" aria-label="Appointment priorities">
                {priorityOptions.map((option) => {
                  const selected = selectedPriorities.includes(option.label);

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => togglePriority(option.label)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all",
                        selected
                          ? "border-plum-300 bg-plum-50 shadow-sm"
                          : "border-plum-100 bg-white hover:border-plum-200 hover:bg-[#fdfafb]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          selected
                            ? "border-plum-600 bg-plum-600 text-white"
                            : "border-plum-200 bg-white text-transparent",
                        )}
                      >
                        <Check className="size-3.5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-plum-950">{option.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.4rem] border bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-plum-500">
                Step 2
              </p>
              <label htmlFor="appointment-context" className="mt-1.5 block text-lg font-semibold tracking-[-.02em] text-plum-950">
                Anything else to share?
              </label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Add a question, worry or detail in your own words.
              </p>
              <Textarea
                id="appointment-context"
                value={additionalContext}
                onChange={(event) => {
                  setAdditionalContext(event.target.value);
                  resetReview();
                }}
                maxLength={500}
                className="mt-4 min-h-28 resize-none text-sm"
                placeholder="For example: I’m worried the pain is getting harder to plan around…"
              />
              <p className="mt-2 text-right text-[10px] text-muted-foreground">
                {additionalContext.length}/500
              </p>
            </section>

            <div className="rounded-2xl border border-sage-200 bg-sage-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-600" />
                <div>
                  <p className="text-xs font-semibold text-sage-800">You decide what leaves Thread</p>
                  <p className="mt-1 text-[11px] leading-5 text-sage-700">
                    Preparing a brief does not send it to your care team. Review it first, then choose whether to share or export it.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section aria-labelledby="brief-preview-title">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-600" />
                <p className="text-xs font-semibold text-plum-800">Live brief preview</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Updates as you make changes</p>
            </div>

            <div className="overflow-hidden rounded-[1.55rem] border border-plum-100 bg-[#fffdfb] shadow-[0_24px_70px_-38px_rgba(42,20,32,.38)]">
              <div className="relative overflow-hidden border-b border-plum-100 bg-[linear-gradient(135deg,#f8f3f6_0%,#fffdfb_70%)] px-5 py-6 sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute -right-8 -top-14 size-44 rounded-full border-[28px] border-plum-100/50" />
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="ai"><Sparkles /> AI-organised</Badge>
                      <Badge variant="outline" className="bg-white/80">
                        {status === "shared" ? "Shared copy" : status === "ready" ? "Reviewed" : "Working draft"}
                      </Badge>
                    </div>
                    <h2 id="brief-preview-title" className="mt-4 text-2xl font-semibold tracking-[-.04em] text-plum-950 sm:text-[2rem]">
                      Appointment brief
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Prepared with {demoPatient.name} for her {appointment.title.toLowerCase()}.
                    </p>
                  </div>
                  <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-plum-950 text-white shadow-sm sm:flex">
                    <ClipboardCheck className="size-5" />
                  </div>
                </div>

                <dl className="relative mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-plum-200/70 pt-5 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Patient</dt>
                    <dd className="mt-1 font-semibold text-plum-950">{demoPatient.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Condition</dt>
                    <dd className="mt-1 font-semibold text-plum-950">{demoPatient.condition}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Appointment</dt>
                    <dd className="mt-1 font-semibold text-plum-950">{format(appointmentDate, "d MMM yyyy")}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Organisation</dt>
                    <dd className="mt-1 font-semibold leading-4 text-plum-950">UCLH</dd>
                  </div>
                </dl>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                {seedAppointmentBrief.sections.map((section, sectionIndex) => {
                  const sectionNumber = sectionIndex + 1;
                  const items: PreviewItem[] =
                    section.key === "patient_priorities"
                      ? selectedPriorityItems
                      : section.items.map((item) => ({
                          id: item.id,
                          text: item.text,
                          evidenceIds: item.evidenceIds,
                        }));

                  if (section.key === "patient_priorities" && items.length === 0) {
                    return (
                      <section key={section.id} className="grid gap-3 border-t border-plum-100 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 sm:py-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[.17em] text-plum-400">
                            {String(sectionNumber).padStart(2, "0")}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold leading-5 text-plum-950">{section.title}</h3>
                        </div>
                        <p className="rounded-xl border border-dashed border-plum-200 bg-plum-50/40 px-3 py-3 text-xs text-muted-foreground">
                          Choose at least one priority to add it here.
                        </p>
                      </section>
                    );
                  }

                  return (
                    <BriefSection
                      key={section.id}
                      title={section.title}
                      sectionNumber={sectionNumber}
                      items={items}
                      onOpenEvidence={openEvidence}
                    />
                  );
                })}

                {additionalContext.trim() ? (
                  <section className="grid gap-3 border-t border-plum-100 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6 sm:py-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.17em] text-plum-400">07</p>
                      <h3 className="mt-1 text-sm font-semibold leading-5 text-plum-950">In Amina’s words</h3>
                    </div>
                    <div className="rounded-2xl border border-plum-100 bg-plum-50/60 p-4">
                      <p className="text-sm italic leading-6 text-plum-900">“{additionalContext.trim()}”</p>
                      <button
                        type="button"
                        onClick={() =>
                          setDrawer({
                            observation: additionalContext.trim(),
                            evidence: [
                              {
                                id: "appointment-preparation-note",
                                eventId: seedAppointmentBrief.id,
                                sourceKind: "patient_reported",
                                label: "Appointment preparation note",
                                excerpt: additionalContext.trim(),
                                recordedAt: seedAppointmentBrief.generatedAt,
                                language: "English",
                              },
                            ],
                            title: "Amina’s original note",
                          })
                        }
                        className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-plum-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-plum-600 shadow-sm transition-colors hover:border-plum-300 hover:bg-plum-50 hover:text-plum-800"
                      >
                        <Link2 className="size-3.5" /> 1 source
                      </button>
                    </div>
                  </section>
                ) : null}

                <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Review before sharing</p>
                      <p className="mt-1 text-xs leading-5 text-amber-800/80">
                        Thread has organised this brief from patient-reported updates and imported records. Check that it is accurate and reflects what you want your care team to know.
                      </p>
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs font-semibold leading-5 text-plum-950 transition-colors hover:bg-white">
                        <input
                          type="checkbox"
                          checked={reviewed}
                          onChange={(event) => {
                            setReviewed(event.target.checked);
                            if (!event.target.checked) setStatus("draft");
                          }}
                          className="mt-0.5 size-4 shrink-0 accent-plum-700"
                        />
                        <span>
                          I’ve checked this brief and it reflects what I want to share.
                          <span className="mt-0.5 block font-normal text-muted-foreground">Nothing is sent when you mark it ready.</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-plum-100 bg-[#faf6f2] px-5 py-5 sm:px-8 sm:py-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div aria-live="polite">
                    <p className="text-sm font-semibold text-plum-950">
                      {status === "shared"
                        ? "Brief shared successfully"
                        : status === "ready"
                          ? "Ready when you are"
                          : "Finish your review to continue"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {status === "shared"
                        ? "Demo complete — no real health data was sent."
                        : status === "ready"
                          ? "Choose how you want to take the brief with you."
                          : "You can still change any priority or note above."}
                    </p>
                  </div>

                  {status === "draft" ? (
                    <Button type="button" onClick={markReady} disabled={!reviewed || !selectedPriorities.length || isPersisting} className="w-full sm:w-auto">
                      {isPersisting ? <LoaderCircle className="animate-spin" /> : <FileCheck2 />} {isPersisting ? "Saving…" : "Mark brief ready"}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={exportBrief}
                        disabled={exported}
                        className="bg-white"
                      >
                        {exported ? <CheckCircle2 /> : <Download />}
                        {exported ? "Exported" : "Export"}
                      </Button>
                      <Button type="button" onClick={shareBrief} disabled={status === "shared" || isPersisting}>
                        {isPersisting ? <LoaderCircle className="animate-spin" /> : status === "shared" ? <CheckCircle2 /> : <Send />}
                        {isPersisting ? "Saving…" : status === "shared" ? "Shared" : "Share brief"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-plum-100 bg-white/60 p-4">
              <SafetyNotice />
              <p className="mt-3 border-t border-plum-100 pt-3 text-[10px] leading-4 text-muted-foreground">
                This is a synthetic product demonstration. The appointment brief supports conversation and does not replace clinical records, diagnosis or professional judgement.
              </p>
            </div>
          </section>
        </div>
      </div>

      <EvidenceDrawer
        open={Boolean(drawer)}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        observation={drawer?.observation ?? ""}
        evidence={drawer?.evidence ?? []}
        title={drawer?.title ?? "Evidence for this brief item"}
      />
    </main>
  );
}
