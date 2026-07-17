import { apiSuccess, handleRouteError } from "@/server/http/api-response";
import { encounterImportInputSchema } from "@/server/schemas";
import { encounterImportService } from "@/server/services/encounter-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = encounterImportInputSchema.parse(await request.json());
    const result = await encounterImportService.importSyntheticEncounter(input);

    return apiSuccess(
      {
        ...result,
        demonstrationNotice:
          "Demonstration of an imported external encounter record. This does not represent live NHS connectivity.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

