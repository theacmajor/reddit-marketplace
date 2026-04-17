import type { Condition } from "@/types/listing";

export type ConditionExtraction = {
  condition: Condition;
  conditionConfidence: number | null;
};

type Rule = { re: RegExp; condition: Condition; confidence: number };

const RULES: Rule[] = [
  {
    re: /\b(?:brand\s*new|sealed|unopened|unused|box\s*pack(?:ed)?|never\s*used|factory\s*sealed)\b/i,
    condition: "NEW",
    confidence: 0.95,
  },
  {
    re: /\b(?:refurbished|refurb)\b/i,
    condition: "REFURBISHED",
    confidence: 0.9,
  },
  {
    re: /\b(?:like\s*new|mint(?:\s*condition|\s*cond)?|pristine|barely\s*used|gently\s*used|as\s*good\s*as\s*new)\b/i,
    condition: "LIKE_NEW",
    confidence: 0.9,
  },
  {
    re: /\b(?:not\s*working|for\s*parts?|spares?\s*only|faulty|broken|dead)\b/i,
    condition: "FOR_PARTS",
    confidence: 0.9,
  },
  {
    re: /\b(?:good\s*condition|well[\s-]*maintained|well[\s-]*kept|excellent\s*condition)\b/i,
    condition: "GOOD",
    confidence: 0.8,
  },
  {
    re: /\b(?:used|second[\s-]*hand|pre[\s-]*owned|working\s*condition)\b/i,
    condition: "USED",
    confidence: 0.7,
  },
];

export function extractCondition(text: string): ConditionExtraction {
  if (!text) return { condition: "UNKNOWN", conditionConfidence: null };
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      return { condition: rule.condition, conditionConfidence: rule.confidence };
    }
  }
  return { condition: "UNKNOWN", conditionConfidence: null };
}
