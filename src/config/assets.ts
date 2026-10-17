// ─────────────────────────────────────────────────────────────
// THE ONLY ASSETS THE SITE USES (14 files). Drop them into /public/assets with these exact names.
// Anything missing falls back to a built-in placeholder. See ASSETS.md for sizes and prompts.
// ─────────────────────────────────────────────────────────────
import { BUSINESS, ADDRESS_LINE, formatUsd } from "./business";
const IMG = import.meta.env.BASE_URL + "assets/images";

export const P = {
  story: `${IMG}/story.webp`,
  fabric: (key: string) => `${IMG}/fabric-${key}.webp`,
  /** ONE neutral-grey photo per hoodie. Every colour is tinted from it in code. */
  product: (slug: string) => `${IMG}/products/${slug}.webp`,
};

export const BRAND = {
  name: BUSINESS.name,
  tagline: BUSINESS.tagline,
  email: BUSINESS.email,
  phone: BUSINESS.phone,
  whatsapp: BUSINESS.whatsapp,
  address: ADDRESS_LINE, // from src/config/business.ts: edit the business details THERE
  currency: BUSINESS.currency,
  currencyCode: BUSINESS.currencyCode,
  freeShippingThreshold: BUSINESS.freeShippingThreshold,
  shippingFlat: BUSINESS.shippingFlat,
};

export const money = formatUsd; // Intl.NumberFormat("en-US", USD)
