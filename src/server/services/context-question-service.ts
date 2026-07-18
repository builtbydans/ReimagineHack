import "server-only";

import { z } from "zod";

import {
  demoPatient,
  EVIDENCE_IDS,
  seedEvidenceReferences,
  seedThreadObservation,
} from "@/data/seed";
import { env, isGeminiConfigured } from "@/lib/env";
import { patientRepository } from "@/server/repositories/patient-repository";
import { timelineRepository } from "@/server/repositories/timeline-repository";
import { contextAnswerSchema } from "@/server/schemas";
import { AiProviderError } from "@/server/services/ai-extraction-service";
import { DomainServiceError } from "@/server/services/service-error";
import type {
  ContextAnswer,
  ContextAnswerSafetyClassification,
  EvidenceReference,
  TimelineEvent,
} from "@/server/types/domain";

type ContextQuestionProviderInput = {
  question: string;
  evidence: EvidenceReference[];
  events: TimelineEvent[];
};

export interface ContextQuestionProvider {
  answer(input: ContextQuestionProviderInput): Promise<ContextAnswer>;
}

export type ContextQuestionResult = {
  answer: ContextAnswer;
  evidence: EvidenceReference[];
};

const CLINICAL_DECISION_RESPONSE =
  "Thread can retrieve Amina’s history, reported symptoms, medication effects and previous clinical context, but it cannot recommend treatment or make clinical decisions.";

const OUT_OF_SCOPE_RESPONSE =
  "Thread can only answer focused questions about Amina’s recorded health story.";

const stopWords = new Set([
  "about", "after", "again", "amina", "and", "are", "before", "does",
  "for", "from", "has", "have", "her", "history", "how", "most", "often",
  "recorded", "report", "reported", "said", "she", "the", "thread", "what",
  "when", "with", "change", "diagnose", "diagnosis", "prescribe", "recommend",
  "safe", "should", "start", "stop", "treatment",
]);

const contextTerms = /\b(?:amina|pain|symptom|naproxen|nausea|medication|dose|food|meal|work|shift|sleep|night|daily|life|affect|fatigue|blood|crp|haemoglobin|platelet|pregnancy|referral|gynaecology|a&e|emergency|encounter|update|voice|transcript|record|timeline|april|may|june|july|when|where|said|report)\b/i;
const clinicalDecisionTerms = /\b(?:diagnos(?:e|is)|what diagnosis|likely diagnosis|what (?:is|could be) causing|cause of (?:her|amina)|could (?:this|it|her (?:symptoms|pain)|amina(?:’s|'s) (?:symptoms|pain)) be|prescrib(?:e|ing)|recommend(?:ation)?|treat(?:ment)?|clinical decision|management plan|increase (?:the )?dose|decrease (?:the )?dose|change (?:her )?medication|stop (?:taking|the)|start (?:taking|her)|safe to take|is (?:she|amina) safe|can (?:she|amina) (?:take|continue|stop|start)|should (?:i|we|she|amina)|what (?:drug|medicine|medication) should)\b/i;
const unsafeModelAnswerTerms = /\b(?:i recommend|thread recommends|should (?:start|stop|take|change|increase|decrease)|diagnosis is|likely diagnosis|prescrib(?:e|ing)|treatment plan)\b/i;

const classifyQuestion = (question: string): ContextAnswerSafetyClassification => {
  if (clinicalDecisionTerms.test(question)) return "clinical_decision_request";
  if (!contextTerms.test(question)) return "out_of_scope";
  return "patient_context";
};

const searchTermsFor = (question: string) => {
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));

  const expanded = new Set(terms);
  if (/work|job|shift|stand/.test(question.toLowerCase())) {
    ["work", "shift", "standing", "stand", "early", "sick"].forEach((term) => expanded.add(term));
  }
  if (/daily life|day.to.day|affect|impact|fatigue/.test(question.toLowerCase())) {
    ["work", "shift", "standing", "early", "sleep", "night", "woke", "tired", "fatigue"].forEach((term) => expanded.add(term));
  }
  if (/sleep|night|overnight|woke|morning|evening|time/.test(question.toLowerCase())) {
    ["sleep", "night", "overnight", "woke", "evening", "morning"].forEach((term) => expanded.add(term));
  }
  if (/naproxen|medication|medicine|dose|nausea|food|meal/.test(question.toLowerCase())) {
    ["naproxen", "medication", "dose", "nausea", "food", "meal"].forEach((term) => expanded.add(term));
  }
  if (/blood|result|test|crp|haemoglobin|platelet|pregnancy/.test(question.toLowerCase())) {
    ["blood", "result", "crp", "haemoglobin", "platelet", "pregnancy"].forEach((term) => expanded.add(term));
  }
  if (/pain|severe|pelvic|abdomen|back/.test(question.toLowerCase())) {
    ["pain", "severe", "pelvic", "abdomen", "back", "severity"].forEach((term) => expanded.add(term));
  }
  return [...expanded];
};

const evidenceSearchText = (
  reference: EvidenceReference,
  event: TimelineEvent | undefined,
) => {
  const observationText = seedThreadObservation.statements
    .filter((statement) => statement.evidenceIds.includes(reference.id))
    .map((statement) => statement.text)
    .join(" ");
  return [
    reference.label,
    reference.excerpt,
    reference.originalExcerpt,
    reference.translatedExcerpt,
    reference.field,
    reference.organisation,
    event?.type,
    event?.title,
    event?.summary,
    event?.originalText,
    event?.translatedText,
    event?.symptoms?.join(" "),
    event?.functionalImpacts?.join(" "),
    event?.medicationDetails ? JSON.stringify(event.medicationDetails) : undefined,
    event?.bloodResults ? JSON.stringify(event.bloodResults) : undefined,
    observationText,
  ].filter(Boolean).join(" ").toLowerCase();
};

const retrieveRelevantEvidence = (
  question: string,
  events: TimelineEvent[],
  references: EvidenceReference[],
  limit = 8,
) => {
  const terms = searchTermsFor(question);
  const eventsById = new Map(events.map((event) => [event.id, event]));

  return references
    .map((reference) => {
      const haystack = evidenceSearchText(reference, eventsById.get(reference.eventId));
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { reference, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.reference.recordedAt).getTime() - new Date(a.reference.recordedAt).getTime())
    .slice(0, limit)
    .map((item) => item.reference);
};

const ids = (...evidenceIds: string[]) => evidenceIds;

export class FallbackContextQuestionProvider implements ContextQuestionProvider {
  async answer(input: ContextQuestionProviderInput): Promise<ContextAnswer> {
    const question = input.question.toLowerCase();

    if (/quick (?:summary|snapshot)|snapshot|overview|summari[sz]e/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "Across the recorded history, Amina’s pelvic pain increased from 6/10 to 8/10 and was reported as interrupting sleep. She left work early twice. Naproxen helped a little but was followed by nausea, and she later avoided a dose. A May A&E attendance recorded stable observations, displayed blood results within range and discharge with GP follow-up advice. A UCLH gynaecology review is booked for 24 July.",
        confidence: "supported",
        evidenceIds: ids(
          EVIDENCE_IDS.secondEarlyDeparture,
          EVIDENCE_IDS.julyPainAndSleep,
          EVIDENCE_IDS.voiceWork,
          EVIDENCE_IDS.aprilMedicationRelief,
          EVIDENCE_IDS.medicationNausea,
          EVIDENCE_IDS.avoidedMedication,
          EVIDENCE_IDS.emergencyReason,
          EVIDENCE_IDS.emergencyObservations,
          EVIDENCE_IDS.emergencyBloods,
          EVIDENCE_IDS.emergencyDisposition,
          EVIDENCE_IDS.emergencyFollowUp,
          EVIDENCE_IDS.appointmentBooked,
        ),
        safetyClassification: "patient_context",
      });
    }

    if (/(?:before|after).*(?:food|meal)|(?:food|meal).*(?:naproxen|medication|dose)/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "The available record does not consistently state whether naproxen was taken before or after food. One update says Amina took it after food; the remaining medication entries do not include meal timing.",
        confidence: "insufficient",
        evidenceIds: ids(EVIDENCE_IDS.medicationNausea),
        missingInformation: "Meal timing was not recorded in the other medication entries.",
        safetyClassification: "patient_context",
      });
    }

    if (/(?:when|time|often).*(?:severe|pain)|(?:severe pain).*(?:when|time|often)/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "The recorded severe episodes cluster around the evening and overnight. The A&E record was logged at 18:42, a translated update described strong pain during the previous night, and a July update described pain waking Amina overnight. The record is too limited to establish a consistent daily pattern.",
        confidence: "partial",
        evidenceIds: ids(EVIDENCE_IDS.emergencyPain, EVIDENCE_IDS.voicePain, EVIDENCE_IDS.julyPainAndSleep),
        missingInformation: "There are not enough time-stamped symptom ratings across mornings, afternoons and evenings to compare patterns reliably.",
        safetyClassification: "patient_context",
      });
    }

    if (/naproxen/.test(question) && /nausea|sick|effect|said|report|help|relief/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "Amina reports partial relief after naproxen, but also nausea. She later avoided a dose because she was worried the nausea would recur. The available record does not establish how consistently it improves her pain.",
        confidence: "partial",
        evidenceIds: ids(
          EVIDENCE_IDS.aprilMedicationRelief,
          EVIDENCE_IDS.medicationNausea,
          EVIDENCE_IDS.medicationUncertainty,
          EVIDENCE_IDS.avoidedMedication,
        ),
        missingInformation: "Consistent before-and-after pain ratings following naproxen were not recorded.",
        safetyClassification: "patient_context",
      });
    }

    if (/work|shift|standing/.test(question) && /sleep|night|woke/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "Amina described difficulty standing at work and leaving early on two recorded occasions. She later said pain reduced her confidence in completing a shift. Sleep was described as poor in June, and an 8/10 pain episode woke her during the night in July.",
        confidence: "supported",
        evidenceIds: ids(
          EVIDENCE_IDS.voiceWork,
          EVIDENCE_IDS.secondEarlyDeparture,
          EVIDENCE_IDS.workConfidence,
          EVIDENCE_IDS.juneSleep,
          EVIDENCE_IDS.julyPainAndSleep,
        ),
        safetyClassification: "patient_context",
      });
    }

    if (/daily life|day.to.day|affect|impact|fatigue/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "Amina reports interrupted sleep, fatigue and difficulty completing a normal day at work. Pain has made standing difficult, and she has left work early twice.",
        confidence: "supported",
        evidenceIds: ids(
          EVIDENCE_IDS.juneSleep,
          EVIDENCE_IDS.julyPainAndSleep,
          EVIDENCE_IDS.voiceWork,
          EVIDENCE_IDS.secondEarlyDeparture,
          EVIDENCE_IDS.workConfidence,
        ),
        safetyClassification: "patient_context",
      });
    }

    if (/a&e|emergency|what happened/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "Amina attended UCLH A&E on 17 May after a severe pelvic pain episode. The record shows stable observations, displayed blood results within range, a negative pregnancy test and analgesia administered. She was discharged home with GP follow-up and return advice.",
        confidence: "supported",
        evidenceIds: ids(
          EVIDENCE_IDS.emergencyReason,
          EVIDENCE_IDS.emergencyPain,
          EVIDENCE_IDS.emergencyObservations,
          EVIDENCE_IDS.emergencyBloods,
          EVIDENCE_IDS.emergencyPregnancyTest,
          EVIDENCE_IDS.emergencyDisposition,
          EVIDENCE_IDS.emergencyFollowUp,
        ),
        safetyClassification: "patient_context",
      });
    }

    if (/blood|crp|haemoglobin|platelet|pregnancy test/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "The imported A&E record lists haemoglobin, white cell count, CRP and platelets within its displayed reference ranges. It also records a negative pregnancy test.",
        confidence: "supported",
        evidenceIds: ids(EVIDENCE_IDS.emergencyBloods, EVIDENCE_IDS.emergencyPregnancyTest),
        safetyClassification: "patient_context",
      });
    }

    if (/referral|gynaecology|appointment/.test(question)) {
      return contextAnswerSchema.parse({
        answer: "A gynaecology referral was made at the GP review on 28 May, remained in progress at the 4 June review, and the record later shows a UCLH gynaecology appointment booked for 24 July 2026.",
        confidence: "supported",
        evidenceIds: ids(EVIDENCE_IDS.gpReferral, EVIDENCE_IDS.gpTracking, EVIDENCE_IDS.appointmentBooked),
        safetyClassification: "patient_context",
      });
    }

    if (input.evidence.length > 0) {
      const selected = input.evidence.slice(0, 3);
      return contextAnswerSchema.parse({
        answer: `The most relevant recorded context is: ${selected.map((item) => item.excerpt).join(" ")}`,
        confidence: "partial",
        evidenceIds: selected.map((item) => item.id),
        missingInformation: "The available records do not support a more specific answer to this question.",
        safetyClassification: "patient_context",
      });
    }

    return contextAnswerSchema.parse({
      answer: "That information was not found in Amina’s available recorded updates or imported encounters.",
      confidence: "insufficient",
      evidenceIds: [],
      missingInformation: "No matching information was recorded in the available health story.",
      safetyClassification: "patient_context",
    });
  }
}

const geminiAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(2_000),
  confidence: z.enum(["supported", "partial", "insufficient"]),
  evidenceIds: z.array(z.string()).max(12),
  missingInformation: z.string().trim().min(1).max(1_000).nullable(),
  safetyClassification: z.enum([
    "patient_context",
    "clinical_decision_request",
    "out_of_scope",
  ]),
});

const geminiAnswerJsonSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    confidence: { type: "string", enum: ["supported", "partial", "insufficient"] },
    evidenceIds: { type: "array", items: { type: "string" } },
    missingInformation: { type: ["string", "null"] },
    safetyClassification: {
      type: "string",
      enum: ["patient_context", "clinical_decision_request", "out_of_scope"],
    },
  },
  required: ["answer", "confidence", "evidenceIds", "missingInformation", "safetyClassification"],
} as const;

type GeminiInteraction = {
  status?: string;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

export class GeminiContextQuestionProvider implements ContextQuestionProvider {
  constructor(private readonly apiKey: string) {}

  async answer(input: ContextQuestionProviderInput): Promise<ContextAnswer> {
    const eventIds = new Set(input.evidence.map((item) => item.eventId));
    const context = {
      patient: { id: demoPatient.id, name: demoPatient.name },
      evidence: input.evidence,
      events: input.events.filter((event) => eventIds.has(event.id)),
      existingObservations: seedThreadObservation.statements.filter((statement) =>
        statement.evidenceIds.some((id) => input.evidence.some((item) => item.id === id)),
      ),
    };
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.5-flash",
        system_instruction: "Answer focused questions about Amina using only the supplied records. Be concise and explicit about uncertainty. Do not diagnose, recommend treatment, prescribe, or use general medical knowledge. Cite only supplied evidence IDs. If the record does not answer the question, say so and describe what is missing.",
        input: `Question: ${input.question}\nAvailable context: ${JSON.stringify(context)}`,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: geminiAnswerJsonSchema,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new AiProviderError(`Gemini context request failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
    }

    const interaction = (await response.json()) as GeminiInteraction;
    const text = interaction.steps?.slice().reverse().find((step) => step.type === "model_output")
      ?.content?.find((content) => content.type === "text")?.text;
    if (!text) {
      throw new AiProviderError(`Gemini returned no context answer (status: ${interaction.status ?? "unknown"}).`);
    }

    try {
      const parsed = geminiAnswerSchema.parse(JSON.parse(text));
      const { missingInformation, ...answer } = parsed;
      return contextAnswerSchema.parse({
        ...answer,
        ...(missingInformation ? { missingInformation } : {}),
      });
    } catch (error) {
      throw new AiProviderError(`Gemini returned an invalid context answer: ${error instanceof Error ? error.message : "unknown validation error"}`);
    }
  }
}

const appendMissingInformation = (current: string | undefined, addition: string) =>
  current ? `${current} ${addition}` : addition;

const verifyAnswerEvidence = (
  rawAnswer: ContextAnswer,
  allowedEvidence: EvidenceReference[],
): ContextAnswer => {
  const allowed = new Set(allowedEvidence.map((reference) => reference.id));
  const evidenceIds = [...new Set(rawAnswer.evidenceIds)].filter((id) => allowed.has(id));
  const referencesRemoved = evidenceIds.length !== new Set(rawAnswer.evidenceIds).size;
  const confidence = rawAnswer.safetyClassification === "patient_context" && rawAnswer.confidence === "supported" && evidenceIds.length === 0
    ? "insufficient"
    : rawAnswer.confidence;

  return contextAnswerSchema.parse({
    ...rawAnswer,
    confidence,
    evidenceIds,
    ...(referencesRemoved
      ? {
          missingInformation: appendMissingInformation(
            rawAnswer.missingInformation,
            "One or more returned source references were not present in the retrieved record and were removed.",
          ),
        }
      : {}),
  });
};

export class ContextQuestionService {
  private readonly fallbackProvider = new FallbackContextQuestionProvider();

  async answer(input: { patientId: string; question: string }): Promise<ContextQuestionResult> {
    const patient = await patientRepository.findById(input.patientId);
    if (!patient) throw new DomainServiceError(404, "PATIENT_NOT_FOUND", "Patient not found.");

    const events = await timelineRepository.listByPatient(input.patientId);
    const eventEvidence = events.flatMap((event) => event.evidenceRefs ?? []);
    const allEvidence = [...new Map(
      [...seedEvidenceReferences, ...eventEvidence].map((reference) => [reference.id, reference]),
    ).values()];
    const relevantEvidence = retrieveRelevantEvidence(input.question, events, allEvidence);
    const classification = classifyQuestion(input.question);

    if (classification === "clinical_decision_request") {
      const answer = contextAnswerSchema.parse({
        answer: CLINICAL_DECISION_RESPONSE,
        confidence: relevantEvidence.length ? "partial" : "insufficient",
        evidenceIds: relevantEvidence.slice(0, 4).map((item) => item.id),
        missingInformation: "Treatment recommendations and clinical decisions are outside Ask Thread’s evidence-retrieval scope.",
        safetyClassification: classification,
      });
      return { answer, evidence: relevantEvidence.slice(0, 4) };
    }

    if (classification === "out_of_scope") {
      const answer = contextAnswerSchema.parse({
        answer: OUT_OF_SCOPE_RESPONSE,
        confidence: "insufficient",
        evidenceIds: [],
        missingInformation: "Ask about Amina’s symptoms, medication effects, work or sleep impact, encounters, results, referrals or recorded updates.",
        safetyClassification: classification,
      });
      return { answer, evidence: [] };
    }

    let rawAnswer: ContextAnswer;
    let allowedEvidence = allEvidence;
    const reliableDemoQuestion = /when is the pain worst|has naproxen helped|affecting daily life|what happened at a&e/i.test(input.question);
    if (reliableDemoQuestion) {
      rawAnswer = await this.fallbackProvider.answer({
        question: input.question,
        evidence: relevantEvidence,
        events,
      });
    } else if (isGeminiConfigured && env.geminiApiKey && relevantEvidence.length) {
      try {
        rawAnswer = await new GeminiContextQuestionProvider(env.geminiApiKey).answer({
          question: input.question,
          evidence: relevantEvidence,
          events,
        });
        if (rawAnswer.safetyClassification !== "patient_context") {
          throw new AiProviderError("Gemini changed the pre-classified patient-context safety boundary.");
        }
        const retrievedIds = new Set(relevantEvidence.map((reference) => reference.id));
        if (rawAnswer.evidenceIds.some((id) => !retrievedIds.has(id))) {
          throw new AiProviderError("Gemini returned a source reference outside the retrieved record.");
        }
        if (unsafeModelAnswerTerms.test(rawAnswer.answer)) {
          throw new AiProviderError("Gemini returned wording outside the patient-context boundary.");
        }
        allowedEvidence = relevantEvidence;
      } catch (error) {
        console.error("[Ask Thread] Gemini unavailable; using deterministic fallback.", error instanceof Error ? error.message : error);
        rawAnswer = await this.fallbackProvider.answer({
          question: input.question,
          evidence: relevantEvidence,
          events,
        });
      }
    } else {
      rawAnswer = await this.fallbackProvider.answer({
        question: input.question,
        evidence: relevantEvidence,
        events,
      });
    }

    const answer = verifyAnswerEvidence(contextAnswerSchema.parse(rawAnswer), allowedEvidence);
    const evidenceById = new Map(allEvidence.map((reference) => [reference.id, reference]));
    const evidence = answer.evidenceIds
      .map((id) => evidenceById.get(id))
      .filter((reference): reference is EvidenceReference => Boolean(reference));
    return { answer, evidence };
  }
}

export const contextQuestionService = new ContextQuestionService();
