import { apiSuccess, handleRouteError } from "@/server/http/api-response";
import { contextAnswerSchema, contextQuestionInputSchema } from "@/server/schemas";
import { contextQuestionService } from "@/server/services/context-question-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = contextQuestionInputSchema.parse(await request.json());
    const result = await contextQuestionService.answer(input);

    return apiSuccess(
      {
        ...result,
        answer: contextAnswerSchema.parse(result.answer),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
