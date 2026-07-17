import { z } from "zod";

import {
  AVAILABLE_APPOINTMENT_PRIORITIES,
  DEMO_PATIENT_ID,
  MAX_AUDIO_UPLOAD_BYTES,
} from "@/lib/constants";

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: "Use an ISO 8601 date and time." });

export const patientUpdateInputSchema = z.object({
  patientId: z.string().uuid().default(DEMO_PATIENT_ID),
  originalText: z
    .string()
    .trim()
    .min(3, "Please include a little more detail in the update.")
    .max(10_000, "The update is too long."),
  translatedText: z.string().trim().min(1).max(10_000).optional(),
  recordedAt: isoDateTime.optional(),
  sourceType: z.enum(["text", "voice"]).default("text"),
  language: z.string().trim().min(2).max(80).optional(),
  severity: z.number().int().min(0).max(10).optional(),
  categories: z
    .array(z.enum(["pain", "sleep", "medication", "work", "mobility", "mood"]))
    .max(6)
    .default([]),
  audioUrl: z.string().url().optional(),
  save: z.boolean().default(false),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateInputSchema>;

const shortStringArray = z.array(z.string().trim().min(1).max(240)).max(30);

/** A patient-reviewed event can be persisted without running extraction again. */
export const reviewedPatientEventSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.enum(["patient_text", "patient_voice"]),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2_000),
  recordedAt: isoDateTime,
  sourceKind: z.literal("patient_reported"),
  language: z.string().trim().min(2).max(80).optional(),
  originalText: z.string().trim().min(3).max(10_000),
  translatedText: z.string().trim().min(1).max(10_000).optional(),
  audioUrl: z.string().url().optional(),
  severity: z.number().int().min(0).max(10).optional(),
  bodyLocations: shortStringArray.optional(),
  symptoms: shortStringArray.optional(),
  functionalImpacts: shortStringArray.optional(),
  medicationDetails: z.object({
    medicationName: z.string().trim().min(1).max(160).optional(),
    action: z.string().trim().min(1).max(500).optional(),
    adherence: z.string().trim().min(1).max(500).optional(),
    reportedSideEffects: shortStringArray.optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ReviewedPatientEventInput = z.infer<typeof reviewedPatientEventSchema>;

export const timelineQuerySchema = z.object({
  patientId: z.string().uuid().default(DEMO_PATIENT_ID),
});

export const encounterImportInputSchema = z.object({
  patientId: z.string().uuid().default(DEMO_PATIENT_ID),
  sourceReference: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .default("SYNTH-UCLH-ED-2026-05-17-AK"),
  simulate: z.literal(true).default(true),
});

export type EncounterImportInput = z.infer<typeof encounterImportInputSchema>;

export const appointmentBriefInputSchema = z.object({
  patientId: z.string().uuid().default(DEMO_PATIENT_ID),
  priorities: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(160),
    )
    .min(1, "Choose at least one priority.")
    .max(8),
  additionalContext: z.string().trim().max(2_000).optional(),
});

export type AppointmentBriefInput = z.infer<
  typeof appointmentBriefInputSchema
>;

export const appointmentBriefStatusInputSchema = z.object({
  patientId: z.string().uuid().default(DEMO_PATIENT_ID),
  status: z.enum(["draft", "ready", "shared"]),
});

export const transcribeMetadataSchema = z.object({
  preferredLanguage: z.string().trim().min(2).max(80).optional(),
  mimeType: z
    .string()
    .trim()
    .regex(/^audio\/[a-zA-Z0-9.+-]+$/, "An audio MIME type is required."),
  byteLength: z
    .number()
    .int()
    .positive("The audio recording is empty.")
    .max(MAX_AUDIO_UPLOAD_BYTES, "The audio recording must be 15 MB or smaller."),
});

export type TranscribeMetadata = z.infer<typeof transcribeMetadataSchema>;

export const availableAppointmentPriorities = new Set<string>(
  AVAILABLE_APPOINTMENT_PRIORITIES,
);
