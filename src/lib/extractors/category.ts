import type { CategorySlug } from "@/types/listing";

export type CategoryExtraction = {
  category: CategorySlug | null;
  categoryConfidence: number | null;
};

const NO_CATEGORY: CategoryExtraction = {
  category: null,
  categoryConfidence: null,
};

type Keyword = { term: RegExp; weight: number };

function kw(term: string, weight = 1): Keyword {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { term: new RegExp(`\\b${escaped}\\b`, "i"), weight };
}

const KEYWORDS: Record<CategorySlug, Keyword[]> = {
  HOUSING: [
    kw("bhk", 3),
    kw("1bhk", 3),
    kw("2bhk", 3),
    kw("3bhk", 3),
    kw("flat", 2),
    kw("apartment", 2),
    kw("villa", 2),
    kw("pg", 2),
    kw("studio", 2),
    kw("rent", 1),
    kw("rental", 1),
    kw("lease", 2),
    kw("deposit", 1),
    kw("brokerage", 2),
    kw("furnished", 1),
    kw("unfurnished", 1),
    kw("sq ft", 2),
    kw("sqft", 2),
    kw("sft", 2),
  ],
  FURNITURE: [
    kw("sofa", 3),
    kw("couch", 3),
    kw("bed", 2),
    kw("mattress", 3),
    kw("wardrobe", 3),
    kw("cupboard", 2),
    kw("dining", 2),
    kw("recliner", 3),
    kw("teak", 2),
    kw("ikea", 3),
    kw("urban ladder", 3),
    kw("pepperfry", 3),
    kw("wakefit", 3),
    kw("bookshelf", 3),
    kw("bean bag", 3),
  ],
  ELECTRONICS: [
    kw("macbook", 3),
    kw("laptop", 3),
    kw("iphone", 3),
    kw("ipad", 3),
    kw("tv", 2),
    kw("monitor", 2),
    kw("headphones?", 2),
    kw("earbuds", 2),
    kw("airpods", 3),
    kw("camera", 2),
    kw("dslr", 3),
    kw("mirrorless", 3),
    kw("playstation", 3),
    kw("ps5", 3),
    kw("ps4", 3),
    kw("xbox", 3),
    kw("nintendo", 3),
    kw("kindle", 3),
    kw("keyboard", 1),
    kw("gpu", 3),
    kw("ryzen", 3),
    kw("ssd", 2),
  ],
  VEHICLES: [
    kw("bike", 2),
    kw("motorcycle", 3),
    kw("scooter", 3),
    kw("royal enfield", 3),
    kw("classic 350", 3),
    kw("bullet", 2),
    kw("activa", 3),
    kw("bicycle", 3),
    kw("cycle", 2),
    kw("trek", 2),
    kw("firefox", 2),
    kw("giant", 2),
    kw("car", 2),
    kw("hatchback", 3),
    kw("sedan", 3),
    kw("suv", 3),
    kw("km", 1),
    kw("kms", 1),
    kw("single owner", 2),
    kw("mileage", 2),
  ],
  SERVICES: [
    kw("tiffin", 3),
    kw("home cook", 3),
    kw("tutor", 3),
    kw("tuition", 3),
    kw("coaching", 2),
    kw("trainer", 2),
    kw("yoga", 3),
    kw("photographer", 3),
    kw("photography", 3),
    kw("freelance", 2),
    kw("consultant", 2),
    kw("services", 1),
    kw("therapist", 2),
    kw("masseuse", 3),
  ],
  FASHION: [
    kw("jeans", 3),
    kw("shirt", 1),
    kw("tshirt", 2),
    kw("t-shirt", 2),
    kw("saree", 3),
    kw("kurta", 3),
    kw("dress", 2),
    kw("shoes", 3),
    kw("sneakers", 3),
    kw("watch", 2),
    kw("levis", 3),
    kw("levi's", 3),
    kw("nike", 2),
    kw("adidas", 2),
    kw("handbag", 3),
  ],
  HOBBIES: [
    kw("guitar", 3),
    kw("piano", 3),
    kw("drum", 3),
    kw("amp", 2),
    kw("amplifier", 2),
    kw("boardgame", 3),
    kw("board game", 3),
    kw("lego", 3),
    kw("book", 1),
    kw("books", 2),
    kw("novel", 2),
    kw("fender", 3),
    kw("stratocaster", 3),
    kw("yamaha", 2),
    kw("catan", 3),
  ],
  OTHER: [],
};

export function extractCategory(
  title: string,
  body: string | null,
): CategoryExtraction {
  if (!title && !body) return NO_CATEGORY;

  const scores: Record<string, number> = {};

  for (const cat of Object.keys(KEYWORDS) as CategorySlug[]) {
    let score = 0;
    for (const kw of KEYWORDS[cat]) {
      if (title && kw.term.test(title)) score += kw.weight * 2;
      if (body && kw.term.test(body)) score += kw.weight;
    }
    if (score > 0) scores[cat] = score;
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) return NO_CATEGORY;

  entries.sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;

  if (topScore < 2) return NO_CATEGORY;

  const margin = (topScore - secondScore) / topScore;
  const confidence = Math.min(0.95, 0.55 + margin * 0.4 + Math.min(topScore, 10) * 0.01);

  return {
    category: topCat as CategorySlug,
    categoryConfidence: Number(confidence.toFixed(2)),
  };
}
