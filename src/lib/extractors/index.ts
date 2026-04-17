import { extractCategory, type CategoryExtraction } from "./category";
import { extractCondition, type ConditionExtraction } from "./condition";
import { extractLocation, type LocationExtraction } from "./location";
import { extractPrice, type PriceExtraction } from "./price";

export { extractCategory } from "./category";
export type { CategoryExtraction } from "./category";
export { extractCondition } from "./condition";
export type { ConditionExtraction } from "./condition";
export { extractLocation } from "./location";
export type { LocationExtraction } from "./location";
export { extractPrice } from "./price";
export type { PriceExtraction } from "./price";

export type ListingExtraction = PriceExtraction &
  LocationExtraction &
  CategoryExtraction &
  ConditionExtraction;

/**
 * Run all heuristic extractors against a listing's title + body.
 * Title is weighted higher than body when an extractor exposes that knob.
 */
export function extractListingFields(
  title: string,
  body: string | null,
): ListingExtraction {
  const combined = body ? `${title}\n${body}` : title;
  const price = extractPrice(combined);
  const location = extractLocation(title, body);
  const category = extractCategory(title, body);
  const condition = extractCondition(combined);

  return {
    ...price,
    ...location,
    ...category,
    ...condition,
  };
}
