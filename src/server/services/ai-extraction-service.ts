import "server-only";

import { z } from "zod";

import {
  seedAppointmentBrief,
  seedThreadObservation,
} from "@/data/seed";
import { env, isGeminiConfigured } from "@/lib/env";
import type {
  AppointmentBrief,
  AppointmentBriefItem,
  AppointmentBriefSectionKey,
  EvidenceReference,
  Patient,
  StructuredPatientUpdate,
  ThreadObservation,
  TimelineEvent,
} from "@/server/types/domain";

export interface HealthExtractionService {
  extractPatientUpdate(input: {
    originalText: string;
    translatedText?: string;
    recordedAt: string;
  }): Promise<StructuredPatientUpdate>;

  generateObservation(input: {
    events: TimelineEvent[];
  }): Promise<ThreadObservation>;

  generateAppointmentBrief(input: {
    patient: Patient;
    events: TimelineEvent[];
    priorities: string[];
  }): Promise<AppointmentBrief>;
}

export class AiProviderError extends Error {
  readonly code = "AI_PROVIDER_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

const sentenceList = (text: string): string[] => {
  const parts = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()];
};

const wordNumber = (text: string): number | undefined => {
  const match = text.match(/\b(10|[0-9])\s*(?:\/\s*10|out of ten)\b/i);
  if (match) return Number(match[1]);

  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const wordMatch = text.match(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+out of ten\b/i,
  );
  return wordMatch ? words[wordMatch[1].toLowerCase()] : undefined;
};

const supportsForSentence = (sentence: string): string[] => {
  const lower = sentence.toLowerCase();
  const supports: string[] = [];
  if (/pain|dard|ache|discomfort|hurt/.test(lower)) supports.push("symptoms");
  if (/\b(?:[0-9]|one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(lower))
    supports.push("severity");
  if (/pelvi|abdomen|pait|back|kamar|head|knee/.test(lower)) supports.push("body location");
  if (/work|kaam|stand|khari|sleep|night|raat|sick/.test(lower))
    supports.push("functional impact");
  if (/medication|naproxen|dose|nausea/.test(lower))
    supports.push("medication notes");
  return supports.length ? supports : ["patient context"];
};

const priorityEvidenceItem = (
  brief: AppointmentBrief,
  priority: string,
): AppointmentBriefItem | undefined => {
  const normalized = priority.toLowerCase();
  const selection: { key: AppointmentBriefSectionKey; index: number } =
    /medication|nausea|side effect/.test(normalized)
      ? { key: "patient_priorities", index: 1 }
      : /work|job|shift/.test(normalized)
        ? { key: "patient_priorities", index: 2 }
        : /sleep/.test(normalized)
          ? { key: "changes_since_last_review", index: 1 }
          : /next step/.test(normalized)
            ? { key: "patient_questions", index: 2 }
            : /increas/.test(normalized)
              ? { key: "patient_questions", index: 1 }
              : { key: "patient_priorities", index: 0 };

  return brief.sections.find((section) => section.key === selection.key)
    ?.items[selection.index];
};

const evidenceReferenceFromEvent = (
  event: TimelineEvent,
  observationId?: string,
): EvidenceReference => ({
  id: crypto.randomUUID(),
  eventId: event.id,
  ...(observationId ? { observationId } : {}),
  sourceKind: event.sourceKind,
  label: event.title,
  excerpt: event.translatedText ?? event.originalText ?? event.summary,
  ...(event.originalText && event.translatedText
    ? {
        originalExcerpt: event.originalText,
        translatedExcerpt: event.translatedText,
      }
    : {}),
  field: event.originalText ? "originalText" : "summary",
  recordedAt: event.recordedAt,
  ...(event.language ? { language: event.language } : {}),
  ...(event.organisation ? { organisation: event.organisation } : {}),
  ...(event.audioUrl ? { audioUrl: event.audioUrl } : {}),
  uncertainty:
    "This source supports an AI-organised item; the organised wording has not been clinically verified.",
});

export class FallbackHealthExtractionService
  implements HealthExtractionService
{
  async extractPatientUpdate(input: {
    originalText: string;
    translatedText?: string;
    recordedAt: string;
  }): Promise<StructuredPatientUpdate> {
    const analysisText = input.translatedText ?? input.originalText;
    const lower = analysisText.toLowerCase();
    const painMentioned = /pain|dard|ache|discomfort|hurt/.test(lower);
    const pelvicPainMentioned = /pelvi|lower abdomen|pait ke neeche/.test(lower);
    const symptoms = [
      ...(painMentioned ? [pelvicPainMentioned ? "Pelvic pain" : "Pain"] : []),
      ...(lower.includes("fatigue") || lower.includes("tired")
        ? ["Fatigue"]
        : []),
      ...(lower.includes("nausea") ? ["Nausea"] : []),
    ];
    const bodyLocations = [
      ...(/pelvi/.test(lower) ? ["Pelvis"] : []),
      ...(/lower abdomen|pait ke neeche/.test(lower)
        ? ["Lower abdomen"]
        : []),
      ...(/lower back|kamar/.test(lower) ? ["Lower back"] : []),
      ...(/head|headache/.test(lower) ? ["Head"] : []),
      ...(/knee/.test(lower) ? ["Knee"] : []),
    ];
    const functionalImpacts = [
      ...(/work|kaam/.test(lower) ? ["Work affected"] : []),
      ...(/stand|khari/.test(lower) ? ["Difficulty standing"] : []),
      ...(/leave early|left early|jaldi ghar/.test(lower)
        ? ["Left work early"]
        : []),
      ...(/woke|sleep|night|raat/.test(lower) ? ["Sleep interrupted"] : []),
    ];
    const medicationMentioned = /medication|naproxen|dose/.test(lower);
    const nauseaMentioned = lower.includes("nausea");
    const avoided = /avoid|did not take|didn't take|unsure whether/.test(lower);
    const questions = sentenceList(analysisText).filter((sentence) =>
      sentence.endsWith("?"),
    );
    if (/alternative|less nausea/.test(lower) && questions.length === 0) {
      questions.push("Are there alternative options that may cause less nausea?");
    }

    return {
      originalText: input.originalText,
      ...(input.translatedText ? { translatedText: input.translatedText } : {}),
      recordedAt: input.recordedAt,
      sourceKind: "patient_reported",
      symptoms: symptoms.length ? [...new Set(symptoms)] : ["Patient-described change"],
      ...(wordNumber(analysisText) === undefined
        ? {}
        : { severity: wordNumber(analysisText) }),
      bodyLocations: [...new Set(bodyLocations)],
      functionalImpacts: [...new Set(functionalImpacts)],
      ...(medicationMentioned || nauseaMentioned
        ? {
            medicationDetails: {
              ...(lower.includes("naproxen")
                ? { medicationName: "Naproxen" }
                : {}),
              action: avoided ? "Dose avoided by patient" : "Patient mentioned use",
              adherence: avoided
                ? "Patient reports an avoided dose"
                : "No adherence change extracted",
              reportedSideEffects: nauseaMentioned ? ["Nausea"] : [],
            },
            medicationNotes: [
              nauseaMentioned
                ? "Patient reports nausea associated with medication use."
                : "Patient mentioned medication in this update.",
            ],
          }
        : {}),
      ...(/woke|sleep|night|raat/.test(lower)
        ? { sleepImpact: "Patient reports interrupted or poor sleep." }
        : {}),
      questionsForNextAppointment: questions,
      evidenceSentences: sentenceList(analysisText).map((sentence, index) => ({
        id: `sentence-${index + 1}`,
        sentence,
        supports: supportsForSentence(sentence),
      })),
    };
  }

  async generateObservation(input: {
    events: TimelineEvent[];
  }): Promise<ThreadObservation> {
    const observation = structuredClone(seedThreadObservation);
    const patientId = input.events[0]?.patientId;
    return patientId ? { ...observation, patientId } : observation;
  }

  async generateAppointmentBrief(input: {
    patient: Patient;
    events: TimelineEvent[];
    priorities: string[];
  }): Promise<AppointmentBrief> {
    const brief = structuredClone(seedAppointmentBrief);
    const prioritySection = brief.sections.find(
      (section) => section.key === "patient_priorities",
    );

    if (prioritySection) {
      prioritySection.items = input.priorities.map((priority, index) => ({
        id: `priority-${index + 1}`,
        text: priority,
        evidenceIds: priorityEvidenceItem(brief, priority)?.evidenceIds ?? [],
        evidenceCount: priorityEvidenceItem(brief, priority)?.evidenceCount ?? 0,
      }));
    }

    return {
      ...brief,
      patientId: input.patient.id,
      appointment: input.patient.nextAppointment ?? brief.appointment,
      status: "draft",
      generatedAt: new Date().toISOString(),
      patientPriorities: input.priorities,
    };
  }
}

const extractedUpdateSchema = z.object({
  symptoms: z.array(z.string()),
  severity: z.number().int().min(0).max(10).nullable(),
  bodyLocations: z.array(z.string()),
  functionalImpacts: z.array(z.string()),
  medicationName: z.string().nullable(),
  medicationAction: z.string().nullable(),
  medicationAdherence: z.string().nullable(),
  reportedSideEffects: z.array(z.string()),
  medicationNotes: z.array(z.string()),
  sleepImpact: z.string().nullable(),
  questionsForNextAppointment: z.array(z.string()),
});

const modelItemSchema = z.object({
  text: z.string(),
  sourceEventIds: z.array(z.string()),
});

const observationModelSchema = z.object({
  title: z.string(),
  summary: z.string(),
  statements: z.array(
    z.object({
      category: z.enum([
        "symptom_trend",
        "sleep",
        "medication",
        "functional_impact",
        "continuity",
      ]),
      text: z.string(),
      sourceEventIds: z.array(z.string()),
      uncertainty: z.string().nullable(),
    }),
  ),
});

const briefModelSchema = z.object({
  mainConcern: z.array(modelItemSchema),
  changesSinceLastReview: z.array(modelItemSchema),
  medication: z.array(modelItemSchema),
  relevantEncounter: z.array(modelItemSchema),
  patientPriorities: z.array(modelItemSchema),
  patientQuestions: z.array(modelItemSchema),
});

const arrayOfStrings = { type: "array", items: { type: "string" } } as const;
const nullableString = { type: ["string", "null"] } as const;
const extractedUpdateJsonSchema = {
  type: "object",
  properties: {
    symptoms: arrayOfStrings,
    severity: { type: ["integer", "null"], minimum: 0, maximum: 10 },
    bodyLocations: arrayOfStrings,
    functionalImpacts: arrayOfStrings,
    medicationName: nullableString,
    medicationAction: nullableString,
    medicationAdherence: nullableString,
    reportedSideEffects: arrayOfStrings,
    medicationNotes: arrayOfStrings,
    sleepImpact: nullableString,
    questionsForNextAppointment: arrayOfStrings,
  },
  required: [
    "symptoms",
    "severity",
    "bodyLocations",
    "functionalImpacts",
    "medicationName",
    "medicationAction",
    "medicationAdherence",
    "reportedSideEffects",
    "medicationNotes",
    "sleepImpact",
    "questionsForNextAppointment",
  ],
} as const;

const modelItemJsonSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    sourceEventIds: arrayOfStrings,
  },
  required: ["text", "sourceEventIds"],
} as const;

const observationJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    statements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "symptom_trend",
              "sleep",
              "medication",
              "functional_impact",
              "continuity",
            ],
          },
          text: { type: "string" },
          sourceEventIds: arrayOfStrings,
          uncertainty: nullableString,
        },
        required: ["category", "text", "sourceEventIds", "uncertainty"],
      },
    },
  },
  required: ["title", "summary", "statements"],
} as const;

const briefJsonSchema = {
  type: "object",
  properties: Object.fromEntries(
    [
      "mainConcern",
      "changesSinceLastReview",
      "medication",
      "relevantEncounter",
      "patientPriorities",
      "patientQuestions",
    ].map((key) => [key, { type: "array", items: modelItemJsonSchema }]),
  ),
  required: [
    "mainConcern",
    "changesSinceLastReview",
    "medication",
    "relevantEncounter",
    "patientPriorities",
    "patientQuestions",
  ],
} as const;

type GeminiInteraction = {
  status?: string;
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const SYSTEM_INSTRUCTION = `You organise synthetic patient-reported and imported clinical context for Thread. Preserve attribution. Never diagnose, claim clinical certainty, provide treatment recommendations, or say a patient is safe. Use phrases such as "patient reports", "imported record states", and "may be useful to discuss". Only use supplied evidence IDs; never invent facts or identifiers.`;

export class GeminiHealthExtractionService implements HealthExtractionService {
  constructor(private readonly apiKey: string) {}

  private async structuredRequest<T>(input: {
    prompt: string;
    jsonSchema: Record<string, unknown>;
    parse: (value: unknown) => T;
  }): Promise<T> {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.5-flash",
          system_instruction: SYSTEM_INSTRUCTION,
          input: input.prompt,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: input.jsonSchema,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const providerMessage = (await response.text()).slice(0, 500);
      throw new AiProviderError(
        `Gemini request failed (${response.status}): ${providerMessage}`,
      );
    }

    const interaction = (await response.json()) as GeminiInteraction;
    const modelStep = interaction.steps
      ?.slice()
      .reverse()
      .find((step) => step.type === "model_output");
    const text = modelStep?.content?.find(
      (content) => content.type === "text",
    )?.text;

    if (!text) {
      throw new AiProviderError(
        `Gemini returned no structured text (status: ${interaction.status ?? "unknown"}).`,
      );
    }

    try {
      return input.parse(JSON.parse(text));
    } catch (error) {
      throw new AiProviderError(
        `Gemini returned an invalid structured response: ${error instanceof Error ? error.message : "unknown validation error"}`,
      );
    }
  }

  async extractPatientUpdate(input: {
    originalText: string;
    translatedText?: string;
    recordedAt: string;
  }): Promise<StructuredPatientUpdate> {
    const modelResult = await this.structuredRequest({
      prompt: `Organise this patient update. Extract only what is explicitly stated.\nRecorded at: ${input.recordedAt}\nOriginal: ${input.originalText}\n${input.translatedText ? `English translation: ${input.translatedText}` : ""}`,
      jsonSchema: extractedUpdateJsonSchema,
      parse: (value) => extractedUpdateSchema.parse(value),
    });
    const sourceText = input.translatedText ?? input.originalText;
    const hasMedicationContext = Boolean(
      modelResult.medicationName ||
        modelResult.medicationAction ||
        modelResult.medicationAdherence ||
        modelResult.reportedSideEffects.length,
    );

    return {
      originalText: input.originalText,
      ...(input.translatedText ? { translatedText: input.translatedText } : {}),
      recordedAt: input.recordedAt,
      sourceKind: "patient_reported",
      symptoms: modelResult.symptoms,
      ...(modelResult.severity === null
        ? {}
        : { severity: modelResult.severity }),
      bodyLocations: modelResult.bodyLocations,
      functionalImpacts: modelResult.functionalImpacts,
      ...(hasMedicationContext
        ? {
            medicationDetails: {
              ...(modelResult.medicationName
                ? { medicationName: modelResult.medicationName }
                : {}),
              ...(modelResult.medicationAction
                ? { action: modelResult.medicationAction }
                : {}),
              ...(modelResult.medicationAdherence
                ? { adherence: modelResult.medicationAdherence }
                : {}),
              reportedSideEffects: modelResult.reportedSideEffects,
            },
          }
        : {}),
      medicationNotes: modelResult.medicationNotes,
      ...(modelResult.sleepImpact
        ? { sleepImpact: modelResult.sleepImpact }
        : {}),
      questionsForNextAppointment: modelResult.questionsForNextAppointment,
      evidenceSentences: sentenceList(sourceText).map((sentence, index) => ({
        id: `sentence-${index + 1}`,
        sentence,
        supports: supportsForSentence(sentence),
      })),
    };
  }

  async generateObservation(input: {
    events: TimelineEvent[];
  }): Promise<ThreadObservation> {
    const modelResult = await this.structuredRequest({
      prompt: `Organise longitudinal changes from these events. Every statement must cite sourceEventIds from the supplied list.\n${JSON.stringify(eventDigest(input.events))}`,
      jsonSchema: observationJsonSchema,
      parse: (value) => observationModelSchema.parse(value),
    });
    const observationId = crypto.randomUUID();
    const allowed = new Set(input.events.map((event) => event.id));
    const evidenceByEventId = new Map(
      input.events.map((event) => [
        event.id,
        evidenceReferenceFromEvent(event, observationId),
      ]),
    );
    const statements = modelResult.statements.map((statement) => {
      const sourceEventIds = statement.sourceEventIds.filter((id) =>
        allowed.has(id),
      );
      const evidenceIds = sourceEventIds
        .map((id) => evidenceByEventId.get(id)?.id)
        .filter((id): id is string => Boolean(id));
      return {
        id: crypto.randomUUID(),
        category: statement.category,
        text: statement.text,
        evidenceIds,
        evidenceCount: evidenceIds.length,
        sourceEventIds,
        ...(statement.uncertainty
          ? { uncertainty: statement.uncertainty }
          : {}),
      };
    });
    const sourceEventIds = [...new Set(statements.flatMap((item) => item.sourceEventIds))];
    const evidenceRefs = sourceEventIds
      .map((id) => evidenceByEventId.get(id))
      .filter((reference): reference is EvidenceReference => Boolean(reference));

    return {
      id: observationId,
      patientId: input.events[0]?.patientId ?? "",
      recordedAt: new Date().toISOString(),
      title: modelResult.title,
      summary: modelResult.summary,
      evidenceSummary: `Based on ${sourceEventIds.length} supporting items.`,
      badge: "AI-organised",
      clinicalVerificationStatus: "not_clinically_verified",
      statements,
      evidenceIds: evidenceRefs.map((reference) => reference.id),
      sourceEventIds,
      evidenceRefs,
    };
  }

  async generateAppointmentBrief(input: {
    patient: Patient;
    events: TimelineEvent[];
    priorities: string[];
  }): Promise<AppointmentBrief> {
    const modelResult = await this.structuredRequest({
      prompt: `Prepare a concise appointment context brief using only these synthetic records. Attribute claims and cite valid sourceEventIds. Patient: ${JSON.stringify(input.patient)}\nPatient priorities: ${JSON.stringify(input.priorities)}\nEvents: ${JSON.stringify(eventDigest(input.events))}`,
      jsonSchema: briefJsonSchema,
      parse: (value) => briefModelSchema.parse(value),
    });
    const briefId = crypto.randomUUID();
    const allowed = new Set(input.events.map((event) => event.id));
    const evidenceByEventId = new Map(
      input.events.map((event) => [event.id, evidenceReferenceFromEvent(event)]),
    );
    const sectionDefinitions: Array<{
      key: AppointmentBriefSectionKey;
      title: string;
      items: Array<{ text: string; sourceEventIds: string[] }>;
    }> = [
      { key: "main_concern", title: "Main concern", items: modelResult.mainConcern },
      {
        key: "changes_since_last_review",
        title: "Changes since last review",
        items: modelResult.changesSinceLastReview,
      },
      { key: "medication", title: "Medication", items: modelResult.medication },
      {
        key: "relevant_encounter",
        title: "Relevant encounter",
        items: modelResult.relevantEncounter,
      },
      {
        key: "patient_priorities",
        title: "Patient priorities",
        items: modelResult.patientPriorities,
      },
      {
        key: "patient_questions",
        title: "Patient questions",
        items: modelResult.patientQuestions,
      },
    ];
    const sections = sectionDefinitions.map((section) => ({
      id: crypto.randomUUID(),
      key: section.key,
      title: section.title,
      items: section.items.map(
        (item): AppointmentBriefItem => {
          const evidenceIds = item.sourceEventIds
            .filter((id) => allowed.has(id))
            .map((id) => evidenceByEventId.get(id)?.id)
            .filter((id): id is string => Boolean(id));
          return {
            id: crypto.randomUUID(),
            text: item.text,
            evidenceIds,
            evidenceCount: evidenceIds.length,
          };
        },
      ),
    }));
    const evidenceIds = [
      ...new Set(
        sections.flatMap((section) =>
          section.items.flatMap((item) => item.evidenceIds),
        ),
      ),
    ];
    const evidenceRefs = [...evidenceByEventId.values()].filter((reference) =>
      evidenceIds.includes(reference.id),
    );

    return {
      id: briefId,
      patientId: input.patient.id,
      appointment:
        input.patient.nextAppointment ?? seedAppointmentBrief.appointment,
      status: "draft",
      generatedAt: new Date().toISOString(),
      patientPriorities: input.priorities,
      sections,
      reviewNotice:
        "Thread organised this brief from patient-reported and imported context. Review it before sharing; it is not clinical advice.",
      evidenceIds,
      evidenceRefs,
    };
  }
}

const eventDigest = (events: TimelineEvent[]) =>
  events.map((event) => ({
    id: event.id,
    type: event.type,
    recordedAt: event.recordedAt,
    sourceKind: event.sourceKind,
    title: event.title,
    summary: event.summary,
    severity: event.severity,
    symptoms: event.symptoms,
    functionalImpacts: event.functionalImpacts,
    medicationDetails: event.medicationDetails,
    bloodResults: event.bloodResults,
  }));

export const createHealthExtractionService = (): HealthExtractionService =>
  isGeminiConfigured
    ? new GeminiHealthExtractionService(env.geminiApiKey!)
    : new FallbackHealthExtractionService();
