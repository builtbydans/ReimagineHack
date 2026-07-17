import "server-only";

import {
  seedAppointmentBrief,
  seedEvidenceReferences,
  seedImportedEncounter,
  seedTimelineEvents,
} from "@/data/seed";
import type {
  AppointmentBrief,
  EvidenceReference,
  ImportedEncounter,
  TimelineEvent,
} from "@/server/types/domain";

type FallbackStore = {
  timelineEvents: TimelineEvent[];
  evidenceReferences: EvidenceReference[];
  appointmentBriefs: AppointmentBrief[];
  importedEncounters: ImportedEncounter[];
};

const clone = <T>(value: T): T => structuredClone(value);

const makeStore = (): FallbackStore => ({
  timelineEvents: clone(seedTimelineEvents),
  evidenceReferences: clone(seedEvidenceReferences),
  appointmentBriefs: [clone(seedAppointmentBrief)],
  importedEncounters: [clone(seedImportedEncounter)],
});

const globalForThread = globalThis as typeof globalThis & {
  __threadFallbackStore?: FallbackStore;
};

/** In-memory server fallback. Browser-local demo events are merged by the UI. */
export const fallbackStore =
  globalForThread.__threadFallbackStore ?? makeStore();

if (process.env.NODE_ENV !== "production") {
  globalForThread.__threadFallbackStore = fallbackStore;
}

