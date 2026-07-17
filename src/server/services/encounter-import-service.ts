import "server-only";

import {
  seedImportedEncounter,
  seedTimelineEvents,
} from "@/data/seed";
import type {
  EncounterImportResult,
  EncounterImportStep,
} from "@/server/types/domain";

import { importedEncounterRepository } from "@/server/repositories/imported-encounter-repository";
import { patientRepository } from "@/server/repositories/patient-repository";
import { timelineRepository } from "@/server/repositories/timeline-repository";
import { DomainServiceError } from "@/server/services/service-error";

const completeSteps = (): EncounterImportStep[] =>
  [
    "Connecting to external record",
    "Reading encounter details",
    "Matching patient and date",
    "Adding verified source context",
    "Encounter imported",
  ].map((label, index) => ({
    id: `import-step-${index + 1}`,
    label,
    status: "complete" as const,
  }));

export class EncounterImportService {
  async importSyntheticEncounter(input: {
    patientId: string;
    sourceReference: string;
  }): Promise<EncounterImportResult> {
    if (input.sourceReference !== seedImportedEncounter.sourceReference) {
      throw new DomainServiceError(
        400,
        "UNKNOWN_DEMO_RECORD",
        "That synthetic encounter record is not available for this demonstration.",
      );
    }

    const patient = await patientRepository.findById(input.patientId);
    if (!patient) {
      throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");
    }

    const existing = await importedEncounterRepository.findBySourceReference(
      input.sourceReference,
    );
    const existingEvent = await timelineRepository.findById(
      seedImportedEncounter.timelineEventId,
    );

    if (existing && existingEvent) {
      return {
        success: true,
        status: "already_imported",
        message: "This synthetic UCLH encounter is already in Amina’s timeline.",
        encounter: existing,
        timelineEvent: existingEvent,
        steps: completeSteps(),
      };
    }

    const sourceEvent = seedTimelineEvents.find(
      (event) => event.id === seedImportedEncounter.timelineEventId,
    );
    if (!sourceEvent) {
      throw new DomainServiceError(
        500,
        "DEMO_RECORD_INCOMPLETE",
        "The synthetic encounter timeline record is unavailable.",
      );
    }

    const timelineEvent = await timelineRepository.save({
      ...structuredClone(sourceEvent),
      patientId: input.patientId,
    });
    const encounter = await importedEncounterRepository.save({
      ...structuredClone(seedImportedEncounter),
      patientId: input.patientId,
      status: "imported",
    });

    return {
      success: true,
      status: "imported",
      message:
        "Synthetic UCLH Emergency Department context was added to the timeline.",
      encounter,
      timelineEvent,
      steps: completeSteps(),
    };
  }
}

export const encounterImportService = new EncounterImportService();

