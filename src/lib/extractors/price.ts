export type PriceExtraction = {
  priceValue: number | null;
  priceRaw: string | null;
  currency: string | null;
  priceConfidence: number | null;
};

const NO_PRICE: PriceExtraction = {
  priceValue: null,
  priceRaw: null,
  currency: null,
  priceConfidence: null,
};

const UNIT_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  l: 100_000,
  lac: 100_000,
  lacs: 100_000,
  lakh: 100_000,
  lakhs: 100_000,
  cr: 10_000_000,
  crore: 10_000_000,
  crores: 10_000_000,
};

function parseAmount(numberStr: string, unit?: string): number | null {
  const n = Number.parseFloat(numberStr.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (!unit) return Math.round(n);
  const mult = UNIT_MULTIPLIERS[unit.toLowerCase()];
  if (!mult) return Math.round(n);
  return Math.round(n * mult);
}

const FREE_RE =
  /\b(?:free(?:\s*pickup|\s*giveaway|\s*to\s*good\s*home)?|giving\s*away|up\s*for\s*grabs)\b/i;

const CURRENCY_AMOUNT_RE =
  /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(k|l|lac|lacs|lakh|lakhs|cr|crore|crores)?\b/i;

const UNIT_SUFFIX_RE =
  /\b([\d,]+(?:\.\d+)?)\s*(k|lac|lacs|lakh|lakhs|cr|crore|crores)\b/i;

const L_SUFFIX_RE = /\b(\d+(?:\.\d+)?)\s*L\b/;
const RUPEE_DASH_RE = /\b([\d,]{3,})\s*\/-/;

const PHONE_LIKE_RE = /(?:^|\D)(\+?91[-\s]?)?[6-9]\d{9}(?:\D|$)/;

function plausible(n: number): boolean {
  return n >= 50 && n <= 500_000_000;
}

export function extractPrice(text: string): PriceExtraction {
  if (!text) return NO_PRICE;
  const cleaned = text.replace(PHONE_LIKE_RE, " ");

  if (FREE_RE.test(cleaned)) {
    return { priceValue: 0, priceRaw: "Free", currency: "INR", priceConfidence: 0.9 };
  }

  let m = cleaned.match(CURRENCY_AMOUNT_RE);
  if (m) {
    const val = parseAmount(m[1], m[2]);
    if (val !== null && plausible(val)) {
      return {
        priceValue: val,
        priceRaw: m[0].trim(),
        currency: "INR",
        priceConfidence: 0.95,
      };
    }
  }

  m = cleaned.match(UNIT_SUFFIX_RE);
  if (m) {
    const val = parseAmount(m[1], m[2]);
    if (val !== null && plausible(val)) {
      return {
        priceValue: val,
        priceRaw: m[0].trim(),
        currency: "INR",
        priceConfidence: 0.85,
      };
    }
  }

  m = cleaned.match(L_SUFFIX_RE);
  if (m) {
    const val = parseAmount(m[1], "l");
    if (val !== null && plausible(val)) {
      return {
        priceValue: val,
        priceRaw: m[0].trim(),
        currency: "INR",
        priceConfidence: 0.75,
      };
    }
  }

  m = cleaned.match(RUPEE_DASH_RE);
  if (m) {
    const val = parseAmount(m[1]);
    if (val !== null && plausible(val)) {
      return {
        priceValue: val,
        priceRaw: m[0].trim(),
        currency: "INR",
        priceConfidence: 0.8,
      };
    }
  }

  return NO_PRICE;
}
