// ──────────────────────────────────────────────────────────────
// ALL PRODUCT DATA LIVES HERE (16 products, 4 colours each). Edit freely.
// Currency is set once in src/config/assets.ts (BRAND.currency).
// Photos: public/assets/products/<slug>-<colour-slug>-card.webp (built by `npm run images`).
// ──────────────────────────────────────────────────────────────

export type Category = "hoodies" | "jackets" | "trousers" | "tshirts";
export type FitGroup = "Oversized" | "Loose" | "Relaxed" | "Regular" | "Slim";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "hoodies", label: "Hoodies" },
  { id: "jackets", label: "Jackets" },
  { id: "trousers", label: "Trousers" },
  { id: "tshirts", label: "T-Shirts" },
];
export const FIT_GROUPS: FitGroup[] = ["Oversized", "Loose", "Relaxed", "Regular", "Slim"];

export interface ColorOpt {
  id: string; // = slug, e.g. "forest-green-cream"
  slug: string;
  name: string;
  hex: string;
  hex2?: string; // second tone for two-colour jackets and patterns
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  type: string;
  fit: string; // shown on the page
  fitGroup: FitGroup; // used by the fit filter
  price: number;
  salePrice?: number;
  stock: "in" | "low" | "out";
  colors: ColorOpt[];
  sizes: string[];
  fabric: { type: string; composition: string; gsm?: number };
  details: string[]; // design details / specs
  story: string;
  madeIn: string;
  manufacturing: string;
  care: string[];
  objectPosition: string; // crop focus: tops/jackets "center top", trench "center 20%", trousers (waist-down photos) "center bottom"
  rating: number;
  reviewCount: number;
  // ── merchandising flags ──
  heroFeatured?: boolean; // the product shown in the home hero (first one flagged wins; falls back to bestSeller, then Nordic Drift)
  heroColor?: string; // colour slug for the hero (default: first colour)
  bestSeller?: boolean;
  isNew?: boolean;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const c = (name: string, hex: string, hex2?: string): ColorOpt => ({ id: slugify(name), slug: slugify(name), name, hex, hex2 });

const LETTERS = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "32", "34", "36", "38"];
const CARE_COTTON = ["Machine wash cold, inside out", "Wash with similar colours", "Do not bleach", "Tumble dry low or line dry", "Warm iron on reverse"];
const CARE_WOOL = ["Dry clean or hand wash cold", "Do not wring or tumble dry", "Dry flat away from heat", "Steam to refresh, press with a cloth"];
const CARE_FAUX = ["Wipe clean with a damp cloth", "Do not machine wash or dry clean", "Store on a wide hanger", "Keep away from direct heat"];

export const products: Product[] = [
  // ───────────── HOODIES ─────────────
  {
    id: "h1", slug: "nordic-drift", name: "Nordic Drift", tagline: "Quiet weight. Boxy ease.", category: "hoodies",
    type: "Oversized boxy pullover hoodie", fit: "Oversized, boxy", fitGroup: "Oversized", price: 148, salePrice: 119, stock: "in",
    colors: [c("Black", "#16161a"), c("Bone", "#e9e4d8"), c("Ash Grey", "#a3a3a6"), c("Charcoal", "#3b3c40")],
    sizes: LETTERS, fabric: { type: "Heavyweight fleece", composition: "100% organic cotton, brushed back", gsm: 450 },
    details: ["Double-layer hood with flat drawcord", "Kangaroo pocket with hidden side entry", "2×2 rib cuffs and hem", "Dropped shoulders, cropped boxy body"],
    story: "A dense 450 GSM fleece falls straight from a dropped shoulder, holding its shape without ever feeling stiff. Nordic Drift is the hoodie we wear on repeat from the first frost to the last.",
    madeIn: "Portugal", manufacturing: "Cut and sewn in a family-run mill near Guimarães. Flatlock seams, double-needle hems, garment-washed for a lived-in hand.",
    care: CARE_COTTON, objectPosition: "center top", rating: 4.8, reviewCount: 214,
  heroFeatured: true, heroColor: "black", bestSeller: true },
  {
    id: "h2", slug: "midnight-ember", name: "Midnight Ember", tagline: "A slow glow in deep colour.", category: "hoodies",
    type: "Regular-fit full-zip hoodie", fit: "Regular", fitGroup: "Regular", price: 164, stock: "in",
    colors: [c("Emerald", "#0f5a48"), c("Sapphire", "#1c3f8f"), c("Plum", "#5a2150"), c("Garnet", "#7a1f2b")],
    sizes: LETTERS, fabric: { type: "Brushed cotton fleece", composition: "80% cotton, 20% recycled polyester", gsm: 400 },
    details: ["Full-length metal zip", "Single-layer hood with round drawcord", "Two zip welt pockets", "Rib cuffs and hem with 2% elastane"],
    story: "Jewel tones were meant for the long dark. A full-length zip and a silky brushed interior make Midnight Ember an easy layer over anything.",
    madeIn: "Turkey", manufacturing: "Garment-dyed in small batches in Bursa for depth of colour, finished with a metal zip and bartacked stress points.",
    care: CARE_COTTON, objectPosition: "center top", rating: 4.7, reviewCount: 168,
  },
  {
    id: "h3", slug: "glacier-haze", name: "Glacier Haze", tagline: "Soft as first frost.", category: "hoodies",
    type: "Relaxed classic pullover hoodie", fit: "Relaxed", fitGroup: "Relaxed", price: 128, salePrice: 109, stock: "low",
    colors: [c("Frost Blue", "#b8d2e6"), c("Blush", "#efcfd0"), c("Lilac", "#cdbfe3"), c("Mint", "#c3e3d3")],
    sizes: ["XS", "S", "M", "L", "XL"], fabric: { type: "French terry", composition: "100% combed cotton", gsm: 320 },
    details: ["Self-fabric hood with round drawcord", "Kangaroo pocket", "Rib cuffs and hem", "Enzyme-washed soft finish"],
    story: "A lighter French terry keeps the silhouette easy and breathable, ideal for crisp days and heated rooms alike, in colours as soft as the first frost.",
    madeIn: "Portugal", manufacturing: "Knitted and sewn in the same mill for full traceability. Pigment-free pastel dyeing keeps colours soft and even.",
    care: CARE_COTTON, objectPosition: "center top", rating: 4.6, reviewCount: 131,
  },
  {
    id: "h4", slug: "aurora-peak", name: "Aurora Peak", tagline: "Worn-in from day one.", category: "hoodies",
    type: "Relaxed vintage-wash graphic pullover", fit: "Relaxed", fitGroup: "Relaxed", price: 138, salePrice: 112, stock: "in",
    colors: [c("Washed Cocoa", "#5a4333"), c("Faded Rust", "#c0654c"), c("Dusty Olive", "#7d8560"), c("Dusty Sand", "#c9b48d")],
    sizes: LETTERS, fabric: { type: "Vintage-wash loopback fleece", composition: "100% cotton, pigment dyed", gsm: 380 },
    details: ["Mountain-and-sun line-art chest print", "Raw-edge hem", "Kangaroo pocket", "Hand-finished vintage wash, every piece is slightly different"],
    story: "A mountain and a low sun, drawn in one thin line. Aurora Peak is pigment-dyed and washed by hand until it feels like your favourite hoodie from ten winters ago.",
    madeIn: "Pakistan", manufacturing: "Pigment-dyed and stone-washed in Lahore in small runs. Water-based chest print, raw-edge hem finished by hand.",
    care: [...CARE_COTTON, "Wash alone the first time: pigment dye may bleed"], objectPosition: "center top", rating: 4.7, reviewCount: 96,
  isNew: true },

  // ───────────── JACKETS ─────────────
  {
    id: "j1", slug: "cloud-puffer", name: "Cloud Puffer", tagline: "Warmth with a soft shine.", category: "jackets",
    type: "Oversized glossy puffer jacket", fit: "Oversized", fitGroup: "Oversized", price: 289, salePrice: 239, stock: "in",
    colors: [c("Cream", "#e9dfc8"), c("Lavender", "#cfc2e6"), c("Olive Green", "#6b6f33"), c("Burnt Orange", "#b5501f")],
    sizes: LETTERS, fabric: { type: "Glossy recycled nylon shell", composition: "Shell 100% recycled nylon · Fill 100% recycled polyester down-alternative" },
    details: ["Horizontal baffle quilting", "Stand collar, full-length matte zip", "Two zip hand pockets", "Elasticated cuffs and hem"],
    story: "Cloud Puffer is cut oversized and filled generously, with a high-gloss finish that catches winter light. Light on the shoulders, serious against the wind.",
    madeIn: "Turkey", manufacturing: "Quilted and filled in Istanbul with a recycled down-alternative that keeps its loft after every wash.",
    care: ["Machine wash cold, gentle cycle", "Tumble dry low with two dryer balls", "Do not iron", "Do not dry clean"], objectPosition: "center top", rating: 4.9, reviewCount: 302,
  bestSeller: true },
  {
    id: "j2", slug: "noir-biker", name: "Noir Biker", tagline: "Sharp lines, soft conscience.", category: "jackets",
    type: "Slim faux-leather biker jacket", fit: "Slim", fitGroup: "Slim", price: 249, salePrice: 209, stock: "low",
    colors: [c("Black", "#16161a"), c("Chocolate Brown", "#4a2f24"), c("Oxblood Red", "#5a1f26"), c("Cognac Tan", "#a8602a")],
    sizes: LETTERS, fabric: { type: "Vegan faux leather", composition: "Polyurethane coating on knit backing · Lining 100% viscose" },
    details: ["Asymmetric zip with notch lapel", "Chest zip pocket and two zip hip pockets", "Belted hem with buckle", "Zipped cuffs, silver-tone hardware"],
    story: "The classic biker, rebuilt in a supple vegan leather. A slim cut, an asymmetric zip and a belted hem give it all the attitude of the original without the animal.",
    madeIn: "Italy", manufacturing: "Cut from a soft-touch faux leather and assembled in Tuscany with bar-tacked hardware and a full viscose lining.",
    care: CARE_FAUX, objectPosition: "center top", rating: 4.7, reviewCount: 142,
  },
  {
    id: "j3", slug: "campus-varsity", name: "Campus Varsity", tagline: "Old-school, finished properly.", category: "jackets",
    type: "Relaxed varsity jacket with contrast sleeves", fit: "Relaxed", fitGroup: "Relaxed", price: 229, salePrice: 189, stock: "in",
    colors: [c("Forest Green / Cream", "#1f5a34", "#efe7d3"), c("Royal Blue / White", "#1f3fb8", "#f4f4f2"), c("Heather Grey / Burgundy", "#9a9a9c", "#6a1f2c"), c("Mustard / Charcoal", "#c8921f", "#3d3e42")],
    sizes: LETTERS, fabric: { type: "Melton wool-blend with faux-leather sleeves", composition: "Body 70% wool, 30% polyester · Sleeves polyurethane faux leather" },
    details: ["Snap-button front", "Striped rib collar, cuffs and hem", "Two welt pockets", "Quilted satin lining"],
    story: "A heavy melton body, contrast faux-leather sleeves and striped rib trims. Campus Varsity keeps the heritage look and adds a relaxed, modern cut.",
    madeIn: "Portugal", manufacturing: "Assembled in Porto with snap closures, striped rib trims knitted to match each colourway and a quilted lining.",
    care: CARE_WOOL, objectPosition: "center top", rating: 4.6, reviewCount: 187,
  },
  {
    id: "j4", slug: "regent-trench", name: "Regent Trench", tagline: "The long way round the rain.", category: "jackets",
    type: "Long belted double-breasted trench coat", fit: "Regular", fitGroup: "Regular", price: 329, stock: "in",
    colors: [c("Stone Beige", "#c8b48f"), c("Ink Navy", "#1d2745"), c("Steel Grey", "#6d7480"), c("Sage Green", "#9aa985")],
    sizes: LETTERS, fabric: { type: "Water-repellent cotton gabardine", composition: "100% cotton, durable water-repellent finish", gsm: 280 },
    details: ["Double-breasted button front with storm flap", "Self-fabric belt and adjustable cuff straps", "Shoulder epaulettes, back vent", "Knee length, fully lined"],
    story: "Cut long and belted at the waist, Regent Trench is cotton gabardine with a water-repellent finish. It's the coat you buy once and wear for twenty winters.",
    madeIn: "Italy", manufacturing: "Tailored in Veneto from tightly woven gabardine with horn-effect buttons and taped inner seams.",
    care: ["Dry clean recommended", "Do not tumble dry", "Hang to dry", "Reproof the finish yearly"], objectPosition: "center 20%", rating: 4.9, reviewCount: 258,
  bestSeller: true },

  // ───────────── TROUSERS ─────────────
  {
    id: "t1", slug: "milan-pleat", name: "Milan Pleat", tagline: "Room to move, lines to keep.", category: "trousers",
    type: "Loose high-waist pleated wide-leg trousers", fit: "Loose, high waist", fitGroup: "Loose", price: 168, stock: "in",
    colors: [c("Charcoal", "#3d3e42"), c("Chocolate Brown", "#4a2f24"), c("Forest Green", "#1f5a34"), c("Cream", "#ece4d0")],
    sizes: WAIST, fabric: { type: "Wool-blend twill", composition: "60% wool, 38% polyester, 2% elastane", gsm: 290 },
    details: ["High waist with side adjusters", "Double forward pleats", "Wide straight leg with a clean break", "Slanted side pockets, back welt pockets"],
    story: "A high waist, deep double pleats and a wide leg that falls straight to the shoe. Milan Pleat is tailoring with room to breathe.",
    madeIn: "Italy", manufacturing: "Cut and pressed in Prato from a wool-blend twill that holds its crease and resists creasing.",
    care: CARE_WOOL, objectPosition: "center bottom", rating: 4.8, reviewCount: 119,
  },
  {
    id: "t2", slug: "savile-slim", name: "Savile Slim", tagline: "Sharp from the first fitting.", category: "trousers",
    type: "Slim flat-front tailored trousers", fit: "Slim", fitGroup: "Slim", price: 138, salePrice: 118, stock: "in",
    colors: [c("Black", "#16161a"), c("Navy", "#1d2540"), c("Burgundy", "#5e1f2a"), c("Light Grey", "#a8a8ab")],
    sizes: WAIST, fabric: { type: "Stretch wool-blend suiting", composition: "55% wool, 43% polyester, 2% elastane", gsm: 260 },
    details: ["Mid rise, flat front", "Slim straight leg, ankle length", "Belt loops, back welt pockets", "A sharp pressed crease"],
    story: "A clean flat front and a slim, straight leg with just enough stretch to move. Savile Slim goes from the office to dinner without changing.",
    madeIn: "Portugal", manufacturing: "Tailored in Braga with a half-canvas waistband and a pressed-in crease that lasts.",
    care: CARE_WOOL, objectPosition: "center bottom", rating: 4.7, reviewCount: 203,
  },
  {
    id: "t3", slug: "coastline-linen", name: "Coastline Linen", tagline: "Cool, creased, completely at ease.", category: "trousers",
    type: "Relaxed drawstring linen trousers", fit: "Relaxed", fitGroup: "Relaxed", price: 98, salePrice: 82, stock: "in",
    colors: [c("Sand", "#d9c9a8"), c("Sky Blue", "#8fb4dc"), c("Terracotta", "#b4532d"), c("White", "#f6f4ee")],
    sizes: WAIST, fabric: { type: "European linen", composition: "100% linen", gsm: 190 },
    details: ["Elasticated waist with drawstring", "Relaxed tapered leg, cropped length", "Side pockets, one back pocket", "Pre-washed for softness"],
    story: "Breathable European linen with an elasticated, drawstring waist. Coastline Linen gets softer and better with every wash. The creases are part of the charm.",
    madeIn: "Portugal", manufacturing: "Woven from European flax and garment-washed in Guimarães for a soft, lived-in hand from day one.",
    care: ["Machine wash cold, gentle cycle", "Line dry", "Iron damp on high heat if desired", "Do not bleach"], objectPosition: "center bottom", rating: 4.6, reviewCount: 88,
  isNew: true },
  {
    id: "t4", slug: "tweed-check", name: "Tweed Check", tagline: "Heritage cloth, cut for now.", category: "trousers",
    type: "Regular-fit patterned wool tweed trousers", fit: "Regular", fitGroup: "Regular", price: 178, salePrice: 148, stock: "low",
    colors: [c("Grey Glen Check", "#8d8d90", "#4a4a4f"), c("Brown Houndstooth", "#a8814f", "#3b2a1c"), c("Navy Pinstripe", "#1d2745", "#cfd3dc"), c("Green Herringbone", "#4a5a40", "#232a22")],
    sizes: WAIST, fabric: { type: "Wool tweed", composition: "80% wool, 20% polyamide", gsm: 420 },
    details: ["Regular straight leg with turn-ups", "Belt loops, flat front", "Slanted side pockets, back welt pockets", "Half-lined at the front"],
    story: "Glen check, houndstooth, pinstripe and herringbone: four classic tweeds, one clean straight cut. Tweed Check wears in beautifully and lasts for decades.",
    madeIn: "United Kingdom", manufacturing: "Woven from Scottish-spun wool and made up in Yorkshire with turn-ups and a half lining.",
    care: CARE_WOOL, objectPosition: "center bottom", rating: 4.8, reviewCount: 74,
  },

  // ───────────── T-SHIRTS ─────────────
  {
    id: "s1", slug: "drop-tee", name: "Drop Tee", tagline: "Heavy cotton. Easy shape.", category: "tshirts",
    type: "Oversized heavyweight plain tee", fit: "Oversized", fitGroup: "Oversized", price: 58, salePrice: 48, stock: "in",
    colors: [c("Off-White", "#f1ece0"), c("Black", "#16161a"), c("Sage Green", "#8ea88e"), c("Chocolate Brown", "#4a2f24")],
    sizes: LETTERS, fabric: { type: "Heavyweight cotton jersey", composition: "100% combed cotton", gsm: 280 },
    details: ["Ribbed crew neck", "Dropped shoulder, boxy body", "Short sleeves with a clean hem", "Pre-shrunk, garment washed"],
    story: "A 280 GSM combed cotton jersey with a dropped shoulder and a boxy hang. Drop Tee has real weight, so it never clings.",
    madeIn: "Portugal", manufacturing: "Knitted and sewn in the same mill, then garment-washed for a soft hand and minimal shrinkage.",
    care: CARE_COTTON, objectPosition: "center top", rating: 4.8, reviewCount: 412,
  bestSeller: true },
  {
    id: "s2", slug: "rib-slim-tee", name: "Rib Slim Tee", tagline: "Close, clean, quietly textured.", category: "tshirts",
    type: "Slim ribbed fitted tee", fit: "Slim", fitGroup: "Slim", price: 46, stock: "in",
    colors: [c("Navy", "#1d2540"), c("Burgundy", "#5e1f2a"), c("Ivory", "#ece6d6"), c("Mustard", "#c79a25")],
    sizes: LETTERS, fabric: { type: "Cotton-elastane rib jersey", composition: "95% cotton, 5% elastane", gsm: 220 },
    details: ["Fine vertical rib texture", "Close fit through chest and arm", "Crew neck, short sleeves", "Hip-length hem"],
    story: "A fine rib that hugs the body and holds its shape. Rib Slim Tee layers cleanly under a jacket and looks just as sharp worn alone.",
    madeIn: "Turkey", manufacturing: "Knitted on fine-gauge circular machines in Denizli with a touch of elastane for recovery.",
    care: CARE_COTTON, objectPosition: "center top", rating: 4.6, reviewCount: 177,
  },
  {
    id: "s3", slug: "acid-wash-tee", name: "Acid Wash Tee", tagline: "No two pieces the same.", category: "tshirts",
    type: "Oversized acid-wash tee with line-art chest graphic", fit: "Oversized", fitGroup: "Oversized", price: 68, salePrice: 56, stock: "in",
    colors: [c("Acid Grey", "#7c7f82"), c("Washed Purple", "#8a76a8"), c("Washed Teal", "#3f7f78"), c("Washed Red", "#a8453f")],
    sizes: LETTERS, fabric: { type: "Acid-washed cotton jersey", composition: "100% cotton, garment dyed", gsm: 260 },
    details: ["Hand-applied acid wash, unique mottling", "Small line-art graphic on the chest", "Oversized fit with dropped shoulder", "Contrast stitched neck"],
    story: "Each Acid Wash Tee is mottled by hand, so no two are quite alike. A small line-art graphic on the chest keeps it quietly confident.",
    madeIn: "Pakistan", manufacturing: "Garment-dyed and acid-washed in Karachi in small runs, with a water-based chest print.",
    care: [...CARE_COTTON, "Wash alone the first time"], objectPosition: "center top", rating: 4.5, reviewCount: 131,
  isNew: true },
  {
    id: "s4", slug: "knit-polo", name: "Knit Polo", tagline: "Textured, tidy, easy to wear.", category: "tshirts",
    type: "Regular textured knit polo", fit: "Regular", fitGroup: "Regular", price: 78, stock: "in",
    colors: [c("Powder Blue", "#9ec1e6"), c("Forest Green", "#1f5a34"), c("Camel", "#b88a56"), c("Lilac", "#cdbbe3")],
    sizes: LETTERS, fabric: { type: "Textured cotton knit", composition: "70% cotton, 30% viscose", gsm: 240 },
    details: ["Honeycomb textured knit", "Two-button placket, soft collar", "Ribbed cuffs and hem", "Regular fit"],
    story: "A honeycomb-textured knit with a soft collar and a two-button placket. Knit Polo is smarter than a tee and easier than a shirt.",
    madeIn: "Portugal", manufacturing: "Knitted in Barcelos on fine-gauge machines, then linked at the collar for a flat, soft finish.",
    care: ["Machine wash cold, gentle cycle", "Reshape and dry flat", "Do not tumble dry", "Cool iron if needed"], objectPosition: "center top", rating: 4.7, reviewCount: 156,
  isNew: true },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const effectivePrice = (p: Product) => p.salePrice ?? p.price;
export const colorOf = (p: Product, id?: string) => p.colors.find((x) => x.id === id) ?? p.colors[0];
export const photoKey = (slug: string, colorSlug: string) => `${slug}-${colorSlug}`;

// ── Size charts (body measurements, cm), one per category ──
export interface SizeChart { title: string; head: string[]; rows: string[][]; note: string }
const TOP_ROWS = [["XS", "86–91", "71–76", "160–167"], ["S", "91–97", "76–81", "165–172"], ["M", "97–102", "81–86", "170–177"], ["L", "102–107", "86–91", "175–182"], ["XL", "107–112", "91–97", "180–187"], ["XXL", "112–117", "97–102", "184–192"]];
export const SIZE_CHARTS: Record<Category, SizeChart> = {
  hoodies: { title: "Hoodies", head: ["Size", "Chest", "Waist", "Height"], rows: TOP_ROWS, note: "Oversized styles are cut generously: size down for a regular fit." },
  jackets: { title: "Jackets", head: ["Size", "Chest", "Waist", "Height"], rows: TOP_ROWS, note: "Jackets are cut to layer over a hoodie. Between sizes, size up for the puffer and trench, down for the biker." },
  tshirts: { title: "T-Shirts", head: ["Size", "Chest", "Waist", "Height"], rows: TOP_ROWS, note: "Drop Tee and Acid Wash Tee are oversized (size down for a regular fit). Rib Slim Tee is close-fitting." },
  trousers: { title: "Trousers", head: ["Size", "Waist", "Hip", "Inseam"], rows: [["28", "71", "92", "79"], ["30", "76", "97", "80"], ["32", "81", "102", "81"], ["34", "86", "107", "82"], ["36", "91", "112", "82"], ["38", "97", "117", "83"]], note: "Waist size in inches. Milan Pleat is a loose fit: take your usual size for a relaxed drape." },
};

/** The product the home hero features. Change it by moving `heroFeatured: true` (or `heroColor`) in the data above. */
export function getHeroProduct() {
  const p = products.find((x) => x.heroFeatured) ?? products.find((x) => x.bestSeller) ?? getProduct("nordic-drift") ?? products[0];
  return { product: p, color: colorOf(p, p.heroColor) };
}
