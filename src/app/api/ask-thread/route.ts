import { apiSuccess, handleRouteError } from "@/server/http/api-response";
import { askThreadRequestSchema } from "@/server/schemas/gemini";
import { contextQuestionService } from "@/server/services/context-question-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const input = askThreadRequestSchema.parse(await request.json());
    const result = await contextQuestionService.answer(input);
    return apiSuccess(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleRouteError(error);
  }
}
