export type LocationExtraction = {
  locationRaw: string | null;
  locationNormalized: string | null;
  locationConfidence: number | null;
};

const NO_LOCATION: LocationExtraction = {
  locationRaw: null,
  locationNormalized: null,
  locationConfidence: null,
};

const NEIGHBORHOODS: string[] = [
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "Whitefield",
  "Jayanagar",
  "BTM Layout",
  "Marathahalli",
  "Hebbal",
  "JP Nagar",
  "Electronic City",
  "Bellandur",
  "Sarjapur",
  "Yelahanka",
  "RT Nagar",
  "Malleshwaram",
  "Banashankari",
  "Basavanagudi",
  "Rajajinagar",
  "Vijayanagar",
  "MG Road",
  "Brigade Road",
  "Ulsoor",
  "Frazer Town",
  "Cox Town",
  "Domlur",
  "CV Raman Nagar",
  "Kalyan Nagar",
  "Kammanahalli",
  "Banaswadi",
  "Thanisandra",
  "Kothanur",
  "Hennur",
  "Yeshwanthpur",
  "Peenya",
  "Nagarbhavi",
  "Kengeri",
  "Rajarajeshwari Nagar",
  "Kanakapura Road",
  "Bannerghatta Road",
  "Silk Board",
  "Richmond Town",
  "Shivajinagar",
  "Mahadevapura",
  "KR Puram",
];

const ALIASES: Array<{ alias: string; canonical: string }> = [
  { alias: "BTM", canonical: "BTM Layout" },
  { alias: "HSR", canonical: "HSR Layout" },
  { alias: "EC", canonical: "Electronic City" },
  { alias: "ECity", canonical: "Electronic City" },
  { alias: "E-City", canonical: "Electronic City" },
  { alias: "JP Nagara", canonical: "JP Nagar" },
  { alias: "Koramanagala", canonical: "Koramangala" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Candidate = {
  raw: string;
  normalized: string;
  source: "title" | "body";
  alias: boolean;
  index: number;
};

function findFirstMatch(
  text: string,
  source: "title" | "body",
): Candidate | null {
  const byLength = [...NEIGHBORHOODS].sort((a, b) => b.length - a.length);

  let best: Candidate | null = null;

  for (const area of byLength) {
    const re = new RegExp(`\\b${escapeRegex(area)}\\b`, "i");
    const m = text.match(re);
    if (m && m.index !== undefined) {
      if (!best || m.index < best.index) {
        best = { raw: m[0], normalized: area, source, alias: false, index: m.index };
      }
    }
  }

  for (const { alias, canonical } of ALIASES) {
    const re = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    const m = text.match(re);
    if (m && m.index !== undefined) {
      if (!best || m.index < best.index) {
        best = { raw: m[0], normalized: canonical, source, alias: true, index: m.index };
      }
    }
  }

  return best;
}

export function extractLocation(
  title: string,
  body: string | null,
): LocationExtraction {
  const titleHit = title ? findFirstMatch(title, "title") : null;
  const bodyHit = body ? findFirstMatch(body, "body") : null;
  const hit = titleHit ?? bodyHit;
  if (!hit) return NO_LOCATION;

  const sourceBoost = hit.source === "title" ? 0.05 : 0;
  const aliasPenalty = hit.alias ? -0.1 : 0;
  const base = hit.source === "title" ? 0.9 : 0.8;

  return {
    locationRaw: hit.raw,
    locationNormalized: hit.normalized,
    locationConfidence: Math.max(0, Math.min(1, base + sourceBoost + aliasPenalty)),
  };
}
