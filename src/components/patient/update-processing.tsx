"use client";

import { Check, LoaderCircle, Mic2, PenLine } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const voiceSteps = [
  "Receiving your update.",
  "Transcribing with Runware.",
  "Organising important details.",
  "Connecting this to your health story.",
  "Update ready.",
];

const writtenSteps = [
  "Receiving your update.",
  "Reading your words.",
  "Organising important details.",
  "Connecting this to your health story.",
  "Update ready.",
];

export function UpdateProcessing({ activeStep, mode }: { activeStep: number; mode: "speak" | "write" }) {
  const steps = mode === "speak" ? voiceSteps : writtenSteps;
  const InputIcon = mode === "speak" ? Mic2 : PenLine;

  return (
    <section className="mx-auto max-w-xl animate-fade-up py-4 sm:py-10" aria-live="polite" aria-busy={activeStep < steps.length - 1}>
      <div className="text-center">
        <span className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-plum-950 text-white shadow-soft">
          <span className="absolute inset-0 animate-soft-pulse rounded-full border border-plum-300" />
          <InputIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-plum-500">Thread is working quietly</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Making sense of your update</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your words stay at the centre. Thread is only organising what you shared so you can review it.</p>
      </div>

      <div className="mt-8 rounded-[1.5rem] border bg-white p-5 shadow-card sm:p-6">
        <Progress value={Math.min(100, ((activeStep + 1) / steps.length) * 100)} className="h-1.5" />
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => {
            const complete = index < activeStep || activeStep === steps.length - 1;
            const active = index === activeStep && activeStep < steps.length - 1;
            return (
              <li key={step} className={cn("flex items-center gap-3 text-sm transition-colors", index <= activeStep ? "text-plum-950" : "text-muted-foreground/55")}>
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold", complete ? "border-sage-200 bg-sage-50 text-sage-700" : active ? "border-plum-200 bg-plum-50 text-plum-700" : "bg-muted/50")}>
                  {complete ? <Check className="size-3.5" /> : active ? <LoaderCircle className="size-3.5 animate-spin" /> : index + 1}
                </span>
                <span className={cn((active || complete) && "font-medium")}>{step}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {mode === "speak" ? <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">If live transcription is not configured, this demonstration uses a clearly labelled synthetic fallback transcript.</p> : null}
    </section>
  );
}
