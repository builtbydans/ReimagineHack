"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileSearch,
  Link2,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SourceBadge } from "@/components/shared/source-badge";
import { TypedText } from "@/components/shared/typed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  AppointmentBrief,
  AppointmentBriefSectionKey,
  AppointmentSummary,
  AskThreadResult,
  EvidenceReference,
  GeneratedAppointmentSummary,
  Patient,
} from "@/server/types/domain";

const suggestedQuestions = [
  "When is the pain worst?",
  "Has naproxen helped?",
  "How is this affecting her daily life?",
  "What happened at A&E?",
] as const;

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { message?: string };
};

type Exchange = {
  id: number;
  question: string;
  result?: AskThreadResult;
  error?: string;
};

const supportDetails = {
  supported: {
    label: "Supported",
    icon: CheckCircle2,
    className: "border-sage-200 bg-sage-50 text-sage-700",
  },
  partially_supported: {
    label: "Partially supported",
    icon: CircleHelp,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  not_found: {
    label: "Not found in record",
    icon: AlertCircle,
    className: "border-border bg-white text-muted-foreground",
  },
} as const;

const itemsFor = (brief: AppointmentBrief, key: AppointmentBriefSectionKey) =>
  brief.sections.find((section) => section.key === key)?.items ?? [];

const summaryFromBrief = (brief: AppointmentBrief): AppointmentSummary => ({
  openingBrief: [
    ...itemsFor(brief, "main_concern"),
    ...itemsFor(brief, "medication"),
    ...itemsFor(brief, "relevant_encounter"),
  ]
    .map((item) => item.text)
    .join(" "),
  changesSinceLastEncounter: itemsFor(
    brief,
    "changes_since_last_review",
  ).map((item) => ({
    statement: item.text,
    evidenceIds: item.evidenceIds,
  })),
  discussionPoints: itemsFor(brief, "patient_questions").map((item) => ({
    statement: item.text,
    evidenceIds: item.evidenceIds,
  })),
  patientPriorities: itemsFor(brief, "patient_priorities").map((item) => ({
    statement: item.text,
    evidenceIds: item.evidenceIds,
  })),
  suggestedQuestions: [...suggestedQuestions],
});

function EvidenceLink({
  label,
  evidenceIds,
  openEvidence,
}: {
  label: string;
  evidenceIds: readonly string[];
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => openEvidence(label, evidenceIds)}
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-plum-700 transition-colors hover:bg-plum-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500"
      aria-label={`View evidence for: ${label}`}
    >
      <Link2 className="size-3" /> Evidence
    </button>
  );
}

function SupportingSources({ evidence }: { evidence: EvidenceReference[] }) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  if (!evidence.length) return null;
  const visibleEvidence = showAll ? evidence : evidence.slice(0, 3);

  return (
    <section className="mt-4" aria-label="Supporting sources">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
          Supporting sources
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {evidence.length} {evidence.length === 1 ? "record" : "records"}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {visibleEvidence.map((source) => {
          const expanded = expandedId === source.id;
          return (
            <article
              key={source.id}
              className="overflow-hidden rounded-xl bg-white ring-1 ring-border"
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={`${expanded ? "Hide" : "Show"} evidence: ${source.label}`}
                onClick={() => setExpandedId(expanded ? null : source.id)}
                className="flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:bg-plum-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plum-500"
              >
                <FileSearch className="size-3.5 shrink-0 text-plum-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {source.label}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <SourceBadge sourceKind={source.sourceKind} compact />
                    <span className="text-[9px] text-muted-foreground">
                      {format(new Date(source.recordedAt), "d MMM yyyy")}
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded ? (
                <div className="border-t bg-[#fbfaf8] px-3 py-3">
                  <p className="text-xs leading-5">“{source.excerpt}”</p>
                  {source.originalExcerpt && source.translatedExcerpt ? (
                    <div className="mt-3 border-t pt-3 text-[11px] leading-5">
                      <p className="font-semibold text-plum-700">
                        Original · {source.language}
                      </p>
                      <p className="mt-1 italic">{source.originalExcerpt}</p>
                      <p className="mt-2 font-semibold text-muted-foreground">
                        English translation
                      </p>
                      <p className="mt-1">{source.translatedExcerpt}</p>
                    </div>
                  ) : null}
                  {source.organisation ? (
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      Source: {source.organisation}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {evidence.length > 3 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-2 text-[11px] font-semibold text-plum-700 hover:underline"
        >
          {showAll
            ? "Show fewer sources"
            : `Show ${evidence.length - 3} more sources`}
        </button>
      ) : null}
    </section>
  );
}

function BriefingSkeleton() {
  return (
    <article
      className="rounded-[1.35rem] bg-white px-5 py-6 shadow-card sm:px-7 sm:py-7"
      aria-busy="true"
      aria-label="Organising Amina’s recorded context"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-plum-600">
        Organising Amina’s recorded context…
      </p>
      <Skeleton className="mt-4 h-7 w-2/3" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="mt-7 grid gap-5 border-t pt-6 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </article>
  );
}

function PreparedBriefing({
  openEvidence,
  patient,
  result,
  loading,
}: {
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
  patient: Patient;
  result: GeneratedAppointmentSummary;
  loading: boolean;
}) {
  if (loading) return <BriefingSkeleton />;

  const { summary } = result;
  const patientFirstName = patient.name.split(" ")[0];

  return (
    <article
      className="rounded-[1.35rem] bg-white px-5 py-6 shadow-card sm:px-7 sm:py-7"
      aria-labelledby="prepared-briefing-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-plum-600">
            {result.mode === "gemini" ? (
              <>
                <Sparkles className="size-3" aria-hidden="true" />
                AI-organised with Gemini
              </>
            ) : (
              "Prepared summary"
            )}
          </p>
          <h2
            id="prepared-briefing-heading"
            className="mt-2 text-xl font-semibold tracking-[-.035em] sm:text-2xl"
          >
            Here’s what to know before seeing {patientFirstName}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Based only on {patientFirstName}’s recorded patient and clinical evidence
          </p>
        </div>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-6 text-foreground/90">
        <TypedText
          text={summary.openingBrief}
          animationKey={`brief:${result.generatedAt}:${summary.openingBrief}`}
        />
      </p>

      <div className="mt-7 grid gap-7 border-t pt-6 lg:grid-cols-[1.35fr_.9fr]">
        <section aria-labelledby="since-last-gp-heading">
          <h3 id="since-last-gp-heading" className="text-sm font-semibold">
            Since the last GP encounter
          </h3>
          <ul className="mt-3 space-y-1">
            {summary.changesSinceLastEncounter.map((change) => (
              <li
                key={`${change.statement}:${change.evidenceIds.join(",")}`}
                className="flex min-h-9 items-center gap-2 text-sm leading-5"
              >
                <Check className="size-3.5 shrink-0 text-sage-700" />
                <span className="flex-1">{change.statement}</span>
                <EvidenceLink
                  label={change.statement}
                  evidenceIds={change.evidenceIds}
                  openEvidence={openEvidence}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <section aria-labelledby="discuss-heading">
            <h3 id="discuss-heading" className="text-sm font-semibold">
              {patientFirstName} wants to discuss
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-5">
              {summary.discussionPoints.map((item) => (
                <li
                  key={`${item.statement}:${item.evidenceIds.join(",")}`}
                  className="flex gap-2"
                >
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-plum-400" />
                  <span className="flex-1">{item.statement}</span>
                  <EvidenceLink
                    label={item.statement}
                    evidenceIds={item.evidenceIds}
                    openEvidence={openEvidence}
                  />
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="priorities-heading">
            <h3 id="priorities-heading" className="text-sm font-semibold">
              Patient priorities
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-5">
              {summary.patientPriorities.map((item) => (
                <li
                  key={`${item.statement}:${item.evidenceIds.join(",")}`}
                  className="flex items-start gap-2"
                >
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-sage-600" />
                  <span className="flex-1">{item.statement}</span>
                  <EvidenceLink
                    label={item.statement}
                    evidenceIds={item.evidenceIds}
                    openEvidence={openEvidence}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}

function AnswerBlock({ exchange }: { exchange: Exchange }) {
  if (!exchange.result) return null;
  const answerDetails = supportDetails[exchange.result.supportLevel];
  const ConfidenceIcon = answerDetails.icon;

  return (
    <div className="mt-3 rounded-2xl bg-[#f8f6f3] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.11em] text-plum-600">
          {exchange.result.mode === "gemini" ? (
            <>
              <Sparkles className="size-3" aria-hidden="true" />
              AI-organised with Gemini
            </>
          ) : (
            "Thread answer"
          )}
        </p>
        <Badge
          variant="outline"
          className={cn("px-2 py-1 text-[9px]", answerDetails.className)}
        >
          <ConfidenceIcon /> {answerDetails.label}
        </Badge>
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-plum-950">
        <TypedText
          text={exchange.result.answer}
          animationKey={`answer:${exchange.id}:${exchange.result.generatedAt}`}
        />
      </p>
      {exchange.result.missingInformation ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">
            What isn’t recorded: {" "}
          </span>
          {exchange.result.missingInformation}
        </p>
      ) : null}
      <SupportingSources evidence={exchange.result.evidence} />
    </div>
  );
}

export function AskThreadPanel({
  patientId,
  openEvidence,
  patient,
  brief,
}: {
  patientId: string;
  openEvidence: (observation: string, evidenceIds: readonly string[]) => void;
  patient: Patient;
  brief: AppointmentBrief;
}) {
  const fallbackSummary = React.useMemo<GeneratedAppointmentSummary>(
    () => ({
      summary: summaryFromBrief(brief),
      mode: "fallback",
      generatedAt: brief.generatedAt,
    }),
    [brief],
  );
  const [briefing, setBriefing] =
    React.useState<GeneratedAppointmentSummary>(fallbackSummary);
  const [briefingLoading, setBriefingLoading] = React.useState(true);
  const [question, setQuestion] = React.useState("");
  const [exchanges, setExchanges] = React.useState<Exchange[]>([]);
  const [loading, setLoading] = React.useState(false);
  const sequence = React.useRef(0);
  const loadingRef = React.useRef(false);

  React.useEffect(() => {
    const controller = new AbortController();
    const loadBriefing = async () => {
      setBriefingLoading(true);
      try {
        const response = await fetch(
          `/api/appointment-summary?patientId=${encodeURIComponent(patientId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const body = (await response.json()) as ApiEnvelope<GeneratedAppointmentSummary>;
        if (!response.ok || !body.ok || !body.data) {
          throw new Error("Prepared briefing unavailable.");
        }
        setBriefing(body.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBriefing(fallbackSummary);
      } finally {
        if (!controller.signal.aborted) setBriefingLoading(false);
      }
    };
    void loadBriefing();
    return () => controller.abort();
  }, [fallbackSummary, patientId]);

  const askQuestion = React.useCallback(
    async (nextQuestion: string, retryId?: number) => {
      const trimmed = nextQuestion.trim();
      if (trimmed.length < 2 || loadingRef.current) return;

      const id = retryId ?? sequence.current + 1;
      sequence.current = Math.max(sequence.current + 1, id);
      loadingRef.current = true;
      setLoading(true);
      setQuestion("");
      setExchanges((current) =>
        retryId
          ? current.map((item) =>
              item.id === retryId ? { id, question: trimmed } : item,
            )
          : [...current, { id, question: trimmed }],
      );

      try {
        const response = await fetch("/api/ask-thread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, question: trimmed }),
        });
        const body = (await response.json()) as ApiEnvelope<AskThreadResult>;
        if (!response.ok || !body.ok || !body.data) {
          throw new Error(
            body.error?.message ?? "Thread could not answer that question.",
          );
        }
        setExchanges((current) =>
          current.map((item) =>
            item.id === id ? { ...item, result: body.data } : item,
          ),
        );
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Thread could not answer that question.";
        setExchanges((current) =>
          current.map((item) =>
            item.id === id ? { ...item, error: message } : item,
          ),
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [patientId],
  );

  return (
    <section className="min-w-0" aria-labelledby="ask-thread-heading">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            id="ask-thread-heading"
            className="text-3xl font-semibold tracking-[-.045em]"
          >
            Ask Thread
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">
            Explore {patient.name}’s recorded health story. Answers are limited
            to recorded patient and clinical evidence.
          </p>
        </div>
        <Badge variant="clinical" className="w-fit py-1.5">
          <ShieldCheck /> Evidence-bounded
        </Badge>
      </header>

      <PreparedBriefing
        openEvidence={openEvidence}
        patient={patient}
        result={briefing}
        loading={briefingLoading}
      />

      <section className="mt-7" aria-labelledby="suggested-questions-heading">
        <h2 id="suggested-questions-heading" className="text-sm font-semibold">
          Suggested questions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => void askQuestion(suggestion)}
              className="rounded-full border bg-white px-4 py-2.5 text-left text-xs font-semibold transition-colors hover:border-plum-300 hover:bg-plum-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {exchanges.length ? (
        <section
          className="mt-7 rounded-[1.35rem] bg-white px-5 shadow-card sm:px-7"
          aria-label="Ask Thread conversation"
          aria-live="polite"
        >
          {exchanges.map((exchange) => {
            const pending =
              loading &&
              exchange.id === exchanges.at(-1)?.id &&
              !exchange.result &&
              !exchange.error;
            return (
              <article key={exchange.id} className="border-b py-6 last:border-0">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.11em] text-muted-foreground">
                    You
                  </span>
                  <h3 className="text-sm font-semibold">{exchange.question}</h3>
                </div>
                {pending ? (
                  <div
                    role="status"
                    className="mt-3 flex items-center gap-2 rounded-xl bg-plum-50 px-4 py-3 text-xs text-plum-800"
                  >
                    <LoaderCircle className="size-4 animate-spin" /> Reviewing
                    the recorded evidence…
                  </div>
                ) : null}
                {exchange.error ? (
                  <div
                    role="alert"
                    className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <p className="flex gap-2 text-xs leading-5 text-amber-900">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {exchange.error}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-amber-900"
                      onClick={() =>
                        void askQuestion(exchange.question, exchange.id)
                      }
                    >
                      Try again
                    </Button>
                  </div>
                ) : null}
                <AnswerBlock exchange={exchange} />
              </article>
            );
          })}
        </section>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void askQuestion(question);
        }}
        className="mt-6 rounded-2xl border bg-white p-2 shadow-card"
      >
        <label htmlFor="ask-thread-question" className="sr-only">
          Ask about {patient.name}’s recorded health story
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ask-thread-question"
            value={question}
            disabled={loading}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Ask about ${patient.name}’s recorded health story…`}
            maxLength={500}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-plum-500 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            className="size-9"
            disabled={loading || question.trim().length < 2}
            aria-label="Ask Thread"
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </form>
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
        Thread retrieves recorded context; it does not provide diagnosis or
        treatment advice.
      </p>
    </section>
  );
}
