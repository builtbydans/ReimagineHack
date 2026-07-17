import { apiSuccess, handleRouteError } from "@/server/http/api-response";
import {
  appointmentBriefInputSchema,
  appointmentBriefStatusInputSchema,
  timelineQuerySchema,
} from "@/server/schemas";
import { appointmentBriefService } from "@/server/services/appointment-brief-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = timelineQuerySchema.parse({
      patientId: url.searchParams.get("patientId") ?? undefined,
    });
    const brief = await appointmentBriefService.getLatest(input.patientId);

    return apiSuccess(
      { brief },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = appointmentBriefInputSchema.parse(await request.json());
    const brief = await appointmentBriefService.generate(input);

    return apiSuccess(
      {
        brief,
        reviewNotice:
          "Review this AI-organised context before sharing. It is not clinically verified and does not provide medical advice.",
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = appointmentBriefStatusInputSchema.parse(await request.json());
    const brief = await appointmentBriefService.setStatus(
      input.patientId,
      input.status,
    );

    return apiSuccess(
      { brief },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

