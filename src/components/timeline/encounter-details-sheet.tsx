"use client";

import { format } from "date-fns";
import { Building2, Check, CircleAlert, FileCheck2, FlaskConical, HeartPulse, MapPin } from "lucide-react";
import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimelineEvent } from "@/server/types/domain";

export function EncounterDetailsSheet({ event, open, onOpenChange }: { event: TimelineEvent | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const details = event?.encounterDetails;
  if (!event || !details) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <div className="mb-3 flex flex-wrap gap-2">
            <SourceBadge sourceKind="imported_clinical_record" />
            <Badge variant="outline">Synthetic values</Badge>
          </div>
          <SheetTitle>{event.title}</SheetTitle>
          <SheetDescription>{format(new Date(event.recordedAt), "d MMMM yyyy, HH:mm")} · {details.reason}</SheetDescription>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2"><Building2 className="size-3.5 text-sage-600" />{event.organisation}</span>
            <span className="flex items-center gap-2"><MapPin className="size-3.5 text-sage-600" />{event.location}</span>
          </div>
        </SheetHeader>
        <SheetBody>
          <Tabs defaultValue="summary">
            <TabsList className="no-scrollbar flex w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary" className="px-4">Summary</TabsTrigger>
              <TabsTrigger value="observations" className="px-4">Observations</TabsTrigger>
              <TabsTrigger value="bloods" className="px-4">Blood results</TabsTrigger>
              <TabsTrigger value="note" className="px-4">Clinician note</TabsTrigger>
              <TabsTrigger value="source" className="px-4">Source record</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-5">
              <div className="rounded-2xl border bg-white p-5">
                <h3 className="text-sm font-semibold">Encounter summary</h3>
                <ul className="mt-4 space-y-3">
                  {details.summaryPoints.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-sage-600" />{point}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-sage-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sage-700">Disposition</p>
                  <p className="mt-2 text-sm font-medium">{details.disposition}</p>
                </div>
                <div className="rounded-2xl bg-plum-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-plum-700">Follow-up</p>
                  <p className="mt-2 text-sm font-medium">{details.followUpAdvice}</p>
                </div>
              </div>
              {details.returnAdvice ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />Imported record states: {details.returnAdvice}</div> : null}
            </TabsContent>

            <TabsContent value="observations">
              <div className="overflow-hidden rounded-2xl border bg-white">
                {details.observations.map((observation, index) => (
                  <div key={observation.name} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><HeartPulse className="size-4 text-sage-600" />{observation.name}</span>
                    <span className="font-semibold">{observation.value}</span>
                    {index < details.observations.length - 1 ? <Separator className="absolute" /> : null}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Synthetic demonstration values imported from the source record. Thread has not independently verified these observations.</p>
            </TabsContent>

            <TabsContent value="bloods">
              <div className="overflow-hidden rounded-2xl border bg-white">
                {details.bloodResults.map((result) => (
                  <div key={result.name} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto]">
                    <span className="flex items-center gap-2 text-sm"><FlaskConical className="size-4 text-sage-600" />{result.name}</span>
                    <span className="text-sm font-semibold">{result.value}</span>
                    <Badge variant={result.status === "within_range" ? "clinical" : "outline"} className="col-span-2 justify-self-start sm:col-span-1">{result.status === "within_range" ? "Within displayed range" : result.status.replaceAll("_", " ")}</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">All results are synthetic demonstration values. Displayed range status comes from the imported record and is not a Thread clinical interpretation.</p>
            </TabsContent>

            <TabsContent value="note">
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-sage-700"><FileCheck2 className="size-4" /> Imported clinician note</div>
                <p className="whitespace-pre-line text-sm leading-7">{details.clinicianNote}</p>
              </div>
            </TabsContent>

            <TabsContent value="source">
              <div className="rounded-2xl border bg-white p-5">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Record</dt><dd className="mt-1 font-medium">{details.sourceRecord.label}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Provider</dt><dd className="mt-1 font-medium">{details.sourceRecord.provider}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Reference</dt><dd className="mt-1 font-mono text-xs">{details.sourceRecord.sourceReference}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Entry method</dt><dd className="mt-1 font-medium">Imported · not entered manually by patient</dd></div>
                </dl>
                <div className="mt-5 rounded-xl bg-muted p-4 text-xs leading-5 text-muted-foreground">Demonstration of an imported external encounter record. This prototype does not claim direct NHS connectivity.</div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
