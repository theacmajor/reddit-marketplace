import { jsonError, jsonOk } from "@/lib/api";
import { extractListingFields } from "@/lib/extractors";
import { prisma } from "@/lib/prisma";
import { USE_PRISMA } from "@/lib/listings-repo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!USE_PRISMA) {
    return jsonError(400, "Normalization requires a live database (USE_PRISMA=1)");
  }

  try {
    const listings = await prisma.listing.findMany({
      where: { isDeleted: false, isRemoved: false },
      select: { id: true, title: true, bodyText: true },
    });

    let updated = 0;
    let failed = 0;

    for (const listing of listings) {
      try {
        const extraction = extractListingFields(listing.title, listing.bodyText);
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            priceRaw: extraction.priceRaw,
            priceValue: extraction.priceValue,
            currency: extraction.currency ?? "INR",
            priceConfidence: extraction.priceConfidence,
            locationRaw: extraction.locationRaw,
            locationNormalized: extraction.locationNormalized,
            locationConfidence: extraction.locationConfidence,
            category: extraction.category,
            categoryConfidence: extraction.categoryConfidence,
            condition: extraction.condition,
          },
        });
        updated++;
      } catch {
        failed++;
      }
    }

    return jsonOk({
      ok: true,
      total: listings.length,
      updated,
      failed,
    });
  } catch (err) {
    return jsonError(500, "Normalization failed", {
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
