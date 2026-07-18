"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileSearch,
  LoaderCircle,
  Send,
  ShieldAlert,
} from "lucide-react";
import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContextAnswer, EvidenceReference } from "@/server/types/domain";

const quickSnapshotQuestion = "Give me a quick summary of Amina’s recorded health story.";

const suggestedQuestions = [
  "When does Amina most often report severe pain?",
  "What has she said about naproxen and nausea?",
  "How have her symptoms affected work and sleep?",
] as const;

type ContextQuestionResponse = {
  answer: ContextAnswer;
  evidence: EvidenceReference[];
};

type ContextQuestionEnvelope = {
  ok: boolean;
  data?: ContextQuestionResponse;
  error?: { message?: string };
};

type AnswerKind = "snapshot" | "question";

const confidenceDetails = {
  supported: { label: "Supported", icon: CheckCircle2, className: "border-sage-200 bg-sage-50 text-sage-700" },
  partial: { label: "Partially supported", icon: CircleHelp, className: "border-amber-200 bg-amber-50 text-amber-800" },
  insufficient: { label: "Insufficient information", icon: AlertCircle, className: "border-border bg-white text-muted-foreground" },
} as const;

function SupportingSources({ evidence }: { evidence: EvidenceReference[] }) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  if (!evidence.length) return null;
  const visibleEvidence = showAll ? evidence : evidence.slice(0, 3);

  return (
    <section className="mt-4 border-t pt-4" aria-labelledby="supporting-sources-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="supporting-sources-heading" className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Supporting sources</h3>
        <span className="text-[10px] text-muted-foreground">{evidence.length} {evidence.length === 1 ? "record" : "records"}</span>
      </div>
      <div className="mt-2 space-y-2">
        {visibleEvidence.map((source) => {
          const expanded = expandedId === source.id;
          return (
            <article key={source.id} className="overflow-hidden rounded-xl border bg-white">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedId(expanded ? null : source.id)}
                className="flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:bg-plum-50/60"
              >
                <FileSearch className="size-3.5 shrink-0 text-plum-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{source.label}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <SourceBadge sourceKind={source.sourceKind} compact />
                    <span className="text-[9px] text-muted-foreground">{format(new Date(source.recordedAt), "d MMM yyyy")}</span>
                  </span>
                </span>
                <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
              </button>
              {expanded ? (
                <div className="border-t bg-[#fbfaf8] px-3 py-3">
                  <p className="text-xs leading-5">“{source.excerpt}”</p>
                  {source.originalExcerpt && source.translatedExcerpt ? (
                    <div className="mt-3 border-t pt-3 text-[11px] leading-5">
                      <p className="font-semibold text-plum-700">Original · {source.language}</p>
                      <p className="mt-1 italic">{source.originalExcerpt}</p>
                      <p className="mt-2 font-semibold text-muted-foreground">English translation</p>
                      <p className="mt-1">{source.translatedExcerpt}</p>
                    </div>
                  ) : null}
                  {source.organisation ? <p className="mt-3 text-[10px] text-muted-foreground">Source: {source.organisation}</p> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {evidence.length > 3 ? (
        <button type="button" onClick={() => setShowAll((current) => !current)} className="mt-2 w-full py-1 text-center text-[11px] font-semibold text-plum-700 hover:underline">
          {showAll ? "Show fewer sources" : `Show ${evidence.length - 3} more sources`}
        </button>
      ) : null}
    </section>
  );
}

export function AskThreadPanel({ patientId }: { patientId: string }) {
  const [question, setQuestion] = React.useState("");
  const [submittedQuestion, setSubmittedQuestion] = React.useState("");
  const [answerKind, setAnswerKind] = React.useState<AnswerKind>("snapshot");
  const [result, setResult] = React.useState<ContextQuestionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);
  const loadingRef = React.useRef(false);
  const initialRequestMade = React.useRef(false);
  const lastRequest = React.useRef<{ question: string; kind: AnswerKind }>({ question: quickSnapshotQuestion, kind: "snapshot" });

  const askQuestion = React.useCallback(async (nextQuestion: string, kind: AnswerKind = "question") => {
    const trimmed = nextQuestion.trim();
    if (trimmed.length < 3 || loadingRef.current) return;

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    loadingRef.current = true;
    lastRequest.current = { question: trimmed, kind };
    if (kind === "question") setQuestion(trimmed);
    setSubmittedQuestion(trimmed);
    setAnswerKind(kind);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/context-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, question: trimmed }),
      });
      const body = await response.json() as ContextQuestionEnvelope;
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error?.message ?? "Thread could not answer that question.");
      }
      if (requestId.current === currentRequest) setResult(body.data);
    } catch (requestError) {
      if (requestId.current === currentRequest) {
        setError(requestError instanceof Error ? requestError.message : "Thread could not answer that question.");
      }
    } finally {
      if (requestId.current === currentRequest) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [patientId]);

  React.useEffect(() => {
    if (initialRequestMade.current) return;
    initialRequestMade.current = true;
    void askQuestion(quickSnapshotQuestion, "snapshot");
  }, [askQuestion]);

  const answerDetails = result ? confidenceDetails[result.answer.confidence] : null;
  const ConfidenceIcon = answerDetails?.icon;

  return (
    <aside className="h-fit overflow-hidden rounded-[1.25rem] border bg-white shadow-card xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto" aria-labelledby="ask-thread-heading">
      <header className="border-b bg-plum-50/55 px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-plum-700 shadow-sm"><Bot className="size-4" /></span>
          <div>
            <h2 id="ask-thread-heading" className="text-base font-semibold tracking-[-.025em]">Ask Thread</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Ask focused questions about Amina’s recorded health story.</p>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4 py-4">
        <div aria-live="polite">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl bg-plum-50 px-4 py-4 text-xs text-plum-800"><LoaderCircle className="size-4 animate-spin" />{answerKind === "snapshot" ? "Preparing a quick snapshot…" : "Searching Amina’s recorded history…"}</div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3 text-xs leading-5 text-amber-900"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>
              <Button variant="ghost" size="sm" className="mt-2 text-amber-900" onClick={() => void askQuestion(lastRequest.current.question, lastRequest.current.kind)}>Try again</Button>
            </div>
          ) : null}

          {result && answerDetails ? (
            <article className="rounded-xl border bg-[#fbfaf8] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.11em] text-plum-600">{answerKind === "snapshot" ? "Quick snapshot" : "Direct answer"}</p>
                  {answerKind === "question" ? <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{submittedQuestion}</p> : null}
                </div>
                <Badge variant="outline" className={cn("px-2 py-1 text-[9px]", answerDetails.className)}>
                  {ConfidenceIcon ? <ConfidenceIcon /> : null}{answerDetails.label}
                </Badge>
              </div>

              <p className="mt-3 text-sm font-medium leading-6 text-plum-950">{result.answer.answer}</p>

              {result.answer.safetyClassification === "clinical_decision_request" ? (
                <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><ShieldAlert className="mt-0.5 size-4 shrink-0" />Ask Thread is limited to retrieving recorded context.</div>
              ) : null}

              {result.answer.missingInformation ? (
                <section className="mt-4 rounded-xl bg-muted/70 p-3" aria-labelledby="missing-information-heading">
                  <h3 id="missing-information-heading" className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Missing information</h3>
                  <p className="mt-1.5 text-xs leading-5">{result.answer.missingInformation}</p>
                </section>
              ) : null}

              <SupportingSources key={result.answer.evidenceIds.join("-")} evidence={result.evidence} />
            </article>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void askQuestion(question);
          }}
          className="rounded-xl border bg-white p-2 shadow-card"
        >
          <label htmlFor="ask-thread-question" className="sr-only">Ask a question about Amina’s recorded history</label>
          <div className="flex items-center gap-2">
            <input
              id="ask-thread-question"
              value={question}
              disabled={loading}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about Amina’s recorded history…"
              maxLength={500}
              className="h-9 min-w-0 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <Button type="submit" size="icon" className="size-8" disabled={loading || question.trim().length < 3} aria-label="Ask Thread">
              {loading ? <LoaderCircle className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </form>

        <section aria-labelledby="suggested-questions-heading">
          <h3 id="suggested-questions-heading" className="text-[10px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Suggested questions</h3>
          <div className="mt-2 space-y-1.5">
            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => void askQuestion(suggestion)}
                className="group flex w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left text-xs font-medium leading-4 transition-colors hover:border-plum-200 hover:bg-plum-50 disabled:opacity-50"
              >
                <CircleHelp className="size-3.5 shrink-0 text-plum-500" />
                <span className="flex-1">{suggestion}</span>
                <ChevronDown className="size-3 -rotate-90 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>

        <p className="border-t pt-4 text-[10px] leading-4 text-muted-foreground">Thread uses Amina’s recorded updates and imported encounters. It does not provide diagnosis or treatment advice.</p>
      </div>
    </aside>
  );
}
