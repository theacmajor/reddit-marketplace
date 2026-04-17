import { jsonError, jsonOk } from "@/lib/api";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getAdminStats();
    return jsonOk(stats);
  } catch (err) {
    return jsonError(500, "Failed to load admin stats", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
