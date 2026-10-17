// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS DETAILS: the ONE place to edit them. Every page (contact, footer, checkout, FAQ, shipping copy, SEO, JSON-LD, map) reads this file.
// All values below marked SAMPLE are placeholders: replace them with your real details before launch.
// ─────────────────────────────────────────────────────────────────────────────
export const BUSINESS = {
  name: "NORDVALE",
  tagline: "Built for the cold. Made to be kept.",

  // Location: Houston, Texas, USA
  street: "1001 Main Street, Suite 200", // SAMPLE street address
  city: "Houston",
  state: "TX",
  stateName: "Texas",
  zip: "77002",
  country: "US",
  countryName: "United States",
  lat: 29.7589, lng: -95.3677, // downtown Houston (used by the map)

  // Contact
  phone: "+1 713 555 0142", // SAMPLE number (555-01xx numbers are reserved for fiction)
  phoneDisplay: "(713) 555-0142",
  email: "support@nordvale.example", // SAMPLE support email
  whatsapp: "17135550142", // digits only, used for https://wa.me/<number>
  instagram: "nordvale", facebook: "nordvale",

  // Support hours (Central Time)
  timezone: "America/Chicago",
  hours: "Mon–Fri 9:00 am–6:00 pm CT · Sat 10:00 am–4:00 pm CT",
  openingHoursSpec: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { dayOfWeek: ["Saturday"], opens: "10:00", closes: "16:00" },
  ],

  // Money: USD only. Prices are formatted with Intl.NumberFormat("en-US").
  currency: "$", currencyCode: "USD",
  freeShippingThreshold: 100, // free standard shipping on US orders over this amount
  shippingFlat: 8, // US standard shipping below the threshold
  intlFlat: 25, intlFreeOver: 250,
  domesticDays: "2–5 business days", intlDays: "7–14 business days",
  returnDays: 30,
} as const;

export const ADDRESS_LINE = `${BUSINESS.street}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.zip}`;
export const ADDRESS_FULL = `${ADDRESS_LINE}, USA`;
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS_FULL)}`;
export const MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_FULL)}`;
export const SHIPS_FROM = `Ships from ${BUSINESS.city}, ${BUSINESS.state}`;

/** schema.org LocalBusiness / Store for JSON-LD and meta */
export const businessJsonLd = {
  "@context": "https://schema.org", "@type": "Store", name: BUSINESS.name, description: "Hoodies, jackets, trousers and t-shirts, shipped from Houston, Texas.",
  telephone: BUSINESS.phone, email: BUSINESS.email, priceRange: "$$", currenciesAccepted: BUSINESS.currencyCode,
  address: { "@type": "PostalAddress", streetAddress: BUSINESS.street, addressLocality: BUSINESS.city, addressRegion: BUSINESS.state, postalCode: BUSINESS.zip, addressCountry: BUSINESS.country },
  geo: { "@type": "GeoCoordinates", latitude: BUSINESS.lat, longitude: BUSINESS.lng },
  openingHoursSpecification: BUSINESS.openingHoursSpec.map((o) => ({ "@type": "OpeningHoursSpecification", ...o })),
  areaServed: { "@type": "Country", name: BUSINESS.countryName },
};

export const US_STATES: [string, string][] = [["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"]];

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** $119 or $119.50: always Intl.NumberFormat("en-US") */
export const formatUsd = (n: number) => (Number.isInteger(n) ? usd0 : usd2).format(n);

/** US phone: digits only → (713) 555-0142 while typing */
export function formatUsPhone(v: string) {
  const d = v.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
  if (d.length < 4) return d; if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
export const isUsZip = (v: string) => /^\d{5}(-\d{4})?$/.test(v.trim());
