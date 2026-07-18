import { z } from "zod";

const evidenceStatementSchema = z
  .object({
    statement: z.string().trim().min(1).max(300),
    evidenceIds: z.array(z.string().trim().min(1)).min(1).max(8),
  })
  .strict();

export const appointmentSummarySchema = z
  .object({
    openingBrief: z.string().trim().min(1).max(1_200),
    changesSinceLastEncounter: z.array(evidenceStatementSchema).max(6),
    discussionPoints: z.array(evidenceStatementSchema).max(5),
    patientPriorities: z.array(evidenceStatementSchema).max(5),
    suggestedQuestions: z
      .array(z.string().trim().min(1).max(160))
      .min(3)
      .max(4),
  })
  .strict();

export const askThreadResponseSchema = z
  .object({
    answer: z.string().trim().min(1).max(1_600),
    supportLevel: z.enum([
      "supported",
      "partially_supported",
      "not_found",
    ]),
    evidenceIds: z.array(z.string().trim().min(1)).max(8),
    missingInformation: z.string().trim().max(500).nullable(),
  })
  .strict();

export const askThreadRequestSchema = z
  .object({
    patientId: z.string().uuid(),
    question: z.string().trim().min(2).max(500),
  })
  .strict();

export const appointmentSummaryJsonSchema = z.toJSONSchema(
  appointmentSummarySchema,
);

export const askThreadResponseJsonSchema = z.toJSONSchema(
  askThreadResponseSchema,
);

export type AppointmentSummaryOutput = z.infer<
  typeof appointmentSummarySchema
>;
export type AskThreadResponseOutput = z.infer<
  typeof askThreadResponseSchema
>;
