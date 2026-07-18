import "server-only";

import { AMINA_PATIENT_ID } from "@/lib/constants";
import { getGeminiClient, getGeminiModel } from "@/server/gemini/client";
import {
  askThreadResponseJsonSchema,
  askThreadResponseSchema,
} from "@/server/schemas/gemini";
import {
  clinicalContextService,
  evidenceReferenceFromAiItem,
} from "@/server/services/clinical-context-service";
import { DomainServiceError } from "@/server/services/service-error";
import type {
  AiEvidenceItem,
  AskThreadResult,
  AskThreadSupportLevel,
  ClinicalContext,
} from "@/server/types/domain";

const ASK_THREAD_SYSTEM_INSTRUCTION = `You are Ask Thread, an evidence-bounded context assistant for clinicians. You are not a doctor or treatment advisor.

Answer the clinician's question only from the supplied evidence about this patient. Never diagnose, recommend treatment or medication changes, determine urgency, use outside medical knowledge, invent facts, or invent evidence IDs. Distinguish patient reports from clinical records. State clearly when evidence is incomplete. Answer concisely and cite all supporting evidence IDs.

Set supportLevel to not_found when the record cannot answer the question, partially_supported when it answers only part, and supported only when the supplied evidence directly supports the answer. missingInformation must explain what the record does not establish. Do not answer beyond the patient record. Return only the required structured response.`;

const clinicalDecisionTerms =
  /\b(?:diagnos(?:e|is)|surgery|operation|treat(?:ment)?|prescrib(?:e|ing)|recommend|should (?:she|amina|i|we)|need(?:s|ed)? (?:surgery|treatment)|change (?:her )?medication|increase (?:the )?dose|stop (?:taking|the)|start (?:taking|her)|safe to take)\b/i;
const unsafeAnswerTerms =
  /\b(?:i recommend|thread recommends|should (?:start|stop|take|change|increase|decrease)|diagnosis is|likely diagnosis|requires surgery|needs surgery|treatment plan)\b/i;

const SAFE_UNAVAILABLE_ANSWER =
  "Thread could not generate an evidence-backed answer at this time. The recorded evidence remains available for inspection.";

const searchableText = (item: AiEvidenceItem) =>
  [
    item.title,
    item.originalText,
    item.translatedText,
    item.summary,
    item.organisation,
    JSON.stringify(item.metadata),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchingEvidence = (
  evidence: AiEvidenceItem[],
  expressions: RegExp[],
  limit = 8,
) =>
  evidence
    .map((item) => ({
      item,
      score: expressions.reduce(
        (score, expression) => score + (expression.test(searchableText(item)) ? 1 : 0),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        Date.parse(right.item.occurredAt) - Date.parse(left.item.occurredAt),
    )
    .slice(0, limit)
    .map(({ item }) => item);

type FallbackAnswer = {
  answer: string;
  supportLevel: AskThreadSupportLevel;
  missingInformation: string | null;
  evidence: AiEvidenceItem[];
};

const deterministicFallback = (
  question: string,
  context: ClinicalContext,
): FallbackAnswer => {
  const lower = question.toLowerCase();

  if (/when is the pain worst|when.*pain|pain.*(?:worst|severe)/i.test(lower)) {
    const evidence = matchingEvidence(context.evidence, [
      /overnight|night|woke|sleep/,
      /evening|18:42/,
      /pain/,
    ]);
    if (evidence.length) {
      return {
        answer:
          "Amina reports worse pain in the evening and overnight, including pain that woke her from sleep. The recorded updates are too limited to establish a consistent daily pattern.",
        supportLevel: "partially_supported",
        missingInformation:
          "The record does not contain enough comparable morning, afternoon and evening pain ratings to establish a reliable pattern.",
        evidence,
      };
    }
  }

  if (/naproxen.*help|help.*naproxen/i.test(lower)) {
    const evidence = matchingEvidence(context.evidence, [
      /naproxen.*(?:relief|edge off|help)/,
      /nausea|sick/,
      /avoid(?:ed)?(?: a)? dose|did not take/,
    ]);
    if (evidence.length) {
      return {
        answer:
          "Amina previously reported partial relief after naproxen. She later reported nausea and avoided another dose because she was concerned it would recur. The record does not establish consistent effectiveness.",
        supportLevel: "partially_supported",
        missingInformation:
          "Consistent before-and-after pain ratings following naproxen were not recorded.",
        evidence,
      };
    }
  }

  if (/daily life|affecting.*life|work|sleep|fatigue/i.test(lower)) {
    const evidence = matchingEvidence(context.evidence, [
      /sleep|woke|night/,
      /fatigue|tired/,
      /standing|work|shift|left early|confidence/,
    ]);
    if (evidence.length) {
      return {
        answer:
          "Amina reports interrupted sleep, fatigue, difficulty standing at work, leaving work early and reduced confidence in completing a shift.",
        supportLevel: "supported",
        missingInformation: null,
        evidence,
      };
    }
  }

  if (/a&e|a and e|emergency|what happened/i.test(lower)) {
    const evidence = matchingEvidence(context.evidence, [
      /a&e|emergency department/,
      /severe pelvic|8\/10/,
      /stable observations/,
      /blood results|pregnancy test/,
      /analgesia|discharg|gp follow-up/,
    ]);
    if (evidence.length) {
      return {
        answer:
          "The recorded A&E encounter describes severe pelvic pain, stable observations, displayed blood results within range, a negative pregnancy test, analgesia and discharge with GP follow-up advice.",
        supportLevel: "supported",
        missingInformation: null,
        evidence,
      };
    }
  }

  return {
    answer: SAFE_UNAVAILABLE_ANSWER,
    supportLevel: "not_found",
    missingInformation:
      "The available record does not support a reliable answer to this question at this time.",
    evidence: [],
  };
};

const contextForPrompt = (question: string, context: ClinicalContext) => ({
  task: "Answer the clinician's evidence-bounded question",
  question,
  patient: {
    condition: context.patient.condition,
    preferredLanguage: context.patient.preferredLanguage,
  },
  evidence: context.evidence,
});

export class ContextQuestionService {
  async answer(input: {
    patientId: string;
    question: string;
  }): Promise<AskThreadResult> {
    if (input.patientId !== AMINA_PATIENT_ID) {
      throw new DomainServiceError(
        403,
        "PATIENT_NOT_ALLOWED",
        "This demo supports only the canonical patient.",
      );
    }

    const context = await clinicalContextService.load(input.patientId);
    const generatedAt = new Date().toISOString();

    if (clinicalDecisionTerms.test(input.question)) {
      return {
        answer:
          "The available record does not establish whether Amina needs surgery. Thread cannot diagnose or recommend treatment.",
        supportLevel: "not_found",
        missingInformation:
          "A treatment decision is not established by the available recorded evidence and requires clinical assessment.",
        evidence: [],
        mode: "fallback",
        generatedAt,
      };
    }

    const fallback = (): AskThreadResult => {
      const result = deterministicFallback(input.question, context);
      return {
        answer: result.answer,
        supportLevel: result.supportLevel,
        missingInformation: result.missingInformation,
        evidence: result.evidence.map(evidenceReferenceFromAiItem),
        mode: "fallback",
        generatedAt,
      };
    };

    const client = getGeminiClient();
    if (!client || !context.evidence.length) return fallback();

    const model = getGeminiModel();
    try {
      const response = await client.models.generateContent({
        model,
        contents: JSON.stringify(contextForPrompt(input.question, context)),
        config: {
          systemInstruction: ASK_THREAD_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          maxOutputTokens: 1_024,
          responseMimeType: "application/json",
          responseJsonSchema: askThreadResponseJsonSchema,
          abortSignal: AbortSignal.timeout(20_000),
        },
      });
      if (!response.text) throw new Error("Gemini returned no answer text.");
      const parsed = askThreadResponseSchema.parse(
        JSON.parse(response.text) as unknown,
      );
      if (unsafeAnswerTerms.test(parsed.answer)) {
        throw new Error("Gemini returned wording outside Thread's safety boundary.");
      }

      const allowedEvidenceById = new Map(
        context.evidence.map((item) => [item.id, item]),
      );
      const uniqueIds = [...new Set(parsed.evidenceIds)];
      const resolvedItems = uniqueIds
        .map((id) => allowedEvidenceById.get(id))
        .filter((item): item is AiEvidenceItem => Boolean(item));
      if (resolvedItems.length !== uniqueIds.length) {
        console.warn("[Thread Ask Thread] Unknown evidence IDs removed", {
          patientId: input.patientId,
          removedCount: uniqueIds.length - resolvedItems.length,
        });
      }

      if (
        parsed.supportLevel !== "not_found" &&
        resolvedItems.length === 0
      ) {
        return {
          answer:
            "The available record does not contain validated evidence for that answer.",
          supportLevel: "not_found",
          missingInformation:
            "No valid supporting evidence was returned from the supplied record.",
          evidence: [],
          mode: "gemini",
          generatedAt,
        };
      }

      console.info("[Thread Ask Thread]", {
        patientId: input.patientId,
        questionLength: input.question.length,
        evidenceCount: context.evidence.length,
        supportLevel: parsed.supportLevel,
        resolvedEvidenceCount: resolvedItems.length,
        model,
      });
      return {
        answer: parsed.answer,
        supportLevel: parsed.supportLevel,
        missingInformation: parsed.missingInformation,
        evidence: resolvedItems.map(evidenceReferenceFromAiItem),
        mode: "gemini",
        generatedAt,
      };
    } catch (error) {
      console.warn("[Thread Ask Thread] Gemini unavailable; using fallback", {
        reason: error instanceof Error ? error.name : "provider_error",
        patientId: input.patientId,
      });
      return fallback();
    }
  }
}

export const contextQuestionService = new ContextQuestionService();
