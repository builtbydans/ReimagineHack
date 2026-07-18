import { z } from "zod";

import { AMINA_PATIENT_ID } from "@/lib/constants";
import { apiSuccess, handleRouteError } from "@/server/http/api-response";
import { geminiAppointmentSummaryService } from "@/server/services/gemini-appointment-summary-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.object({
  patientId: z.string().uuid().default(AMINA_PATIENT_ID),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = querySchema.parse({
      patientId: url.searchParams.get("patientId") ?? undefined,
    });
    const result = await geminiAppointmentSummaryService.generate(
      input.patientId,
    );
    return apiSuccess(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleRouteError(error);
  }
}
