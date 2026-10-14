// Goods that may not be listed on Reselldock. Matched against title, description,
// category and tags. This is a first-line filter, not a substitute for the Terms.
const RESTRICTED = [
  { label: "alcohol", re: /\b(alcohol|beer|lager|wine|whisky|whiskey|vodka|gin|rum|brandy|spirits?|liquor|cider|champagne|prosecco)\b/i },
  { label: "tobacco", re: /\b(tobacco|cigarettes?|cigars?|rolling tobacco|snuff|shisha)\b/i },
  { label: "vapes", re: /\b(vapes?|vaping|e-?cig(arette)?s?|e-?liquids?|vape juice|disposable vapes?)\b/i },
  { label: "knives", re: /\b(knife|knives|blades?|machetes?|daggers?|swords?|flick ?knife)\b/i },
  { label: "medicines", re: /\b(medicines?|medication|prescription|pharmaceuticals?|painkillers?|paracetamol|ibuprofen|steroids?|prescription-only)\b/i },
  { label: "age-restricted items", re: /\b(adult toys?|sex toys?|fireworks?|firearms?|air guns?|airsoft|ammunition|lottery|gambling|poppers)\b/i },
];

export function findRestrictedGoods({ title, description, category, tags }) {
  const text = [title, description, category, ...(Array.isArray(tags) ? tags : [])]
    .filter(Boolean)
    .join(" ");
  return RESTRICTED.filter((r) => r.re.test(text)).map((r) => r.label);
}
