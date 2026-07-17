"use client";

import { format } from "date-fns";
import { AudioLines, Languages, Link2, Quote, ShieldQuestion } from "lucide-react";
import { SourceBadge, VerificationBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { EvidenceReference } from "@/server/types/domain";

export type EvidenceDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observation: string;
  evidence: EvidenceReference[];
  title?: string;
};

function AudioPreview({ audioUrl }: { audioUrl: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-plum-600"><AudioLines className="size-3.5" /> Source audio</p>
      <audio controls src={audioUrl} className="w-full" aria-label="Playback of the source patient update" />
    </div>
  );
}

export function EvidenceDrawer({ open, onOpenChange, observation, evidence, title = "Evidence behind this observation" }: EvidenceDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="ai"><Link2 /> Evidence trail</Badge>
            <VerificationBadge />
          </div>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>See exactly which reported updates or imported record fields Thread used to organise this view.</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
              <ShieldQuestion className="size-4" /> AI-organised observation
            </div>
            <p className="text-base font-semibold leading-6 text-plum-950">{observation}</p>
            <p className="mt-2 text-xs leading-5 text-amber-800/80">This pattern has not been clinically verified. It may be useful to discuss with a healthcare professional.</p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Supporting sources</h3>
            <span className="text-xs text-muted-foreground">{evidence.length} {evidence.length === 1 ? "item" : "items"}</span>
          </div>

          <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[17px] before:top-5 before:w-px before:bg-plum-200">
            {evidence.map((item, index) => (
              <article key={item.id} className="relative pl-12">
                <span className="absolute left-0 top-1 flex size-9 items-center justify-center rounded-full border-4 border-background bg-white text-xs font-bold text-plum-700 shadow-sm">{index + 1}</span>
                <div className="rounded-2xl border bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge sourceKind={item.sourceKind} compact />
                    <span className="text-[11px] text-muted-foreground">{format(new Date(item.recordedAt), "d MMM yyyy")}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-plum-800">{item.label}</p>
                  <blockquote className="mt-2 flex gap-2 text-sm leading-6 text-foreground">
                    <Quote className="mt-1 size-3.5 shrink-0 text-plum-400" />
                    <span>“{item.excerpt}”</span>
                  </blockquote>

                  {item.originalExcerpt && item.translatedExcerpt ? (
                    <div className="mt-4 overflow-hidden rounded-xl border bg-[#fbf8fa]">
                      <div className="flex items-center gap-2 border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-plum-600">
                        <Languages className="size-3.5" /> Original · {item.language ?? "Urdu"}
                      </div>
                      <p className="px-3 py-3 text-xs italic leading-5 text-plum-900">{item.originalExcerpt}</p>
                      <Separator />
                      <div className="px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">English translation</p>
                        <p className="mt-1 text-xs leading-5">{item.translatedExcerpt}</p>
                      </div>
                    </div>
                  ) : null}

                  {item.audioUrl ? <div className="mt-3"><AudioPreview audioUrl={item.audioUrl} /></div> : null}
                  {!item.audioUrl && item.originalExcerpt ? <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[10px] leading-4 text-muted-foreground">Source audio is not included in this synthetic prototype.</p> : null}

                  {item.field ? <p className="mt-3 text-[10px] text-muted-foreground">Record field: <span className="font-mono text-foreground">{item.field}</span></p> : null}
                  {item.organisation ? <p className="mt-1 text-[10px] text-muted-foreground">Source organisation: {item.organisation}</p> : null}
                  {item.uncertainty ? <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[11px] leading-4 text-muted-foreground">{item.uncertainty}</p> : null}
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl bg-muted p-4 text-xs leading-5 text-muted-foreground">
            Evidence is shown to preserve Amina’s voice and separate reported information from imported clinical records. Thread organises context; it does not make a diagnosis or clinical conclusion.
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
