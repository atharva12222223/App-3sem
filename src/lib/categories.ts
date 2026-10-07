// Vendor categories with icon + label. Icons use emoji as a universal,
// zero-dependency visual language for varying literacy levels; swap for
// an SVG icon set (e.g. Lucide) when branding is finalized.

export type CategoryId =
  | "FOOD"
  | "CHAAT"
  | "VEGETABLES"
  | "FRUITS"
  | "FLOWERS"
  | "CLOTHING"
  | "FOOTWEAR"
  | "HOUSEHOLD"
  | "TOYS"
  | "OTHER";

export const CATEGORIES: {
  id: CategoryId;
  icon: string;
  en: string;
  hi: string;
}[] = [
  { id: "FOOD", icon: "🍛", en: "Food", hi: "खाना" },
  { id: "CHAAT", icon: "🥘", en: "Chaat", hi: "चाट" },
  { id: "VEGETABLES", icon: "🥬", en: "Vegetables", hi: "सब्ज़ी" },
  { id: "FRUITS", icon: "🍌", en: "Fruits", hi: "फल" },
  { id: "FLOWERS", icon: "🌼", en: "Flowers", hi: "फूल" },
  { id: "CLOTHING", icon: "👕", en: "Clothing", hi: "कपड़े" },
  { id: "FOOTWEAR", icon: "👡", en: "Footwear", hi: "जूते" },
  { id: "HOUSEHOLD", icon: "🍳", en: "Household", hi: "घरेलू" },
  { id: "TOYS", icon: "🧸", en: "Toys", hi: "खिलौने" },
  { id: "OTHER", icon: "🛒", en: "Other", hi: "अन्य" },
];

export function categoryInfo(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? { id: "OTHER", icon: "🛒", en: id, hi: id };
}
