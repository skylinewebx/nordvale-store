// ─────────────────────────────────────────────────────────────
// THE ONLY ASSETS THE SITE USES (14 files). Drop them into /public/assets with these exact names.
// Anything missing falls back to a built-in placeholder. See ASSETS.md for sizes and prompts.
// ─────────────────────────────────────────────────────────────
const IMG = import.meta.env.BASE_URL + "assets/images";

export const P = {
  story: `${IMG}/story.webp`,
  fabric: (key: string) => `${IMG}/fabric-${key}.webp`,
  /** ONE neutral-grey photo per hoodie. Every colour is tinted from it in code. */
  product: (slug: string) => `${IMG}/products/${slug}.webp`,
};

export const BRAND = {
  name: "NORDVALE",
  tagline: "Built for the cold. Made to be kept.",
  email: "hello@nordvale.example",
  phone: "+92 300 0000000",
  whatsapp: "923000000000",
  address: "12 Mall Road, Lahore, Pakistan",
  currency: "$", // the ONE place the currency symbol is set
  currencyCode: "USD",
  freeShippingThreshold: 150,
  shippingFlat: 9,
};

export const money = (n: number) => `${BRAND.currency}${n.toFixed(n % 1 ? 2 : 0)}`;
