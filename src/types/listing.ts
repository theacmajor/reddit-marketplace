export const CATEGORY_SLUGS = [
  "HOUSING",
  "FURNITURE",
  "ELECTRONICS",
  "VEHICLES",
  "FASHION",
  "HOBBIES",
  "SERVICES",
  "OTHER",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  HOUSING: "Housing & Rentals",
  FURNITURE: "Furniture",
  ELECTRONICS: "Electronics",
  VEHICLES: "Vehicles",
  FASHION: "Fashion",
  HOBBIES: "Hobbies",
  SERVICES: "Services",
  OTHER: "Other",
};

export type SourceType =
  | "REDDIT_API"
  | "REDDIT_PUSHSHIFT"
  | "REDDIT_RSS"
  | "MANUAL"
  | "IMPORT";

export type ListingStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "SOLD"
  | "EXPIRED"
  | "REMOVED"
  | "HIDDEN"
  | "FLAGGED";

export type Condition =
  | "NEW"
  | "LIKE_NEW"
  | "GOOD"
  | "USED"
  | "FOR_PARTS"
  | "REFURBISHED"
  | "UNKNOWN";

export type Listing = {
  id: string;
  redditPostId: string;
  redditUrl: string;
  subreddit: string;
  title: string;
  bodyText: string | null;
  author: string;
  createdUtc: string;
  upvotes: number;
  numComments: number;
  thumbnail: string | null;
  imageUrls: string[];
  priceRaw: string | null;
  priceValue: number | null;
  currency: string | null;
  locationRaw: string | null;
  locationNormalized: string | null;
  category: string | null;
  condition: Condition;
  status: ListingStatus;
  sourceType: SourceType;
  syncLastRunAt: string | null;
  priceConfidence: number | null;
  locationConfidence: number | null;
  categoryConfidence: number | null;
  scamFlag: boolean;
  duplicateGroupId: string | null;
  hasImages: boolean;
  isDeleted: boolean;
  isRemoved: boolean;
  lastSeenOnReddit: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SortOption =
  | "newest"
  | "oldest"
  | "price_low_high"
  | "price_high_low"
  | "most_upvoted"
  | "most_commented";

export type PostedWithin = "1d" | "7d" | "30d" | "all";

export type ListingFilters = {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  hasImage?: boolean;
  postedWithin?: PostedWithin;
  minUpvotes?: number;
  sort?: SortOption;
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  price_low_high: "Price: low to high",
  price_high_low: "Price: high to low",
  most_upvoted: "Most upvoted",
  most_commented: "Most commented",
};

export const POSTED_WITHIN_LABELS: Record<PostedWithin, string> = {
  "1d": "Past 24 hours",
  "7d": "Past week",
  "30d": "Past month",
  all: "Any time",
};

export const UPVOTE_PRESETS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Any" },
  { value: 10, label: "10+" },
  { value: 50, label: "50+" },
  { value: 100, label: "100+" },
  { value: 500, label: "500+" },
];
