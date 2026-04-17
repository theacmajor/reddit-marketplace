import { jsonError, jsonOk } from "@/lib/api";
import { fetchFilters } from "@/lib/listings-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const facets = await fetchFilters();
    return jsonOk(facets);
  } catch (err) {
    return jsonError(500, "Failed to fetch filter facets", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
