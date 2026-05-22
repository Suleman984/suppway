/**
 * Demo product catalog used while the Supabase-backed catalog is still
 * being wired up. Image URLs point at Pexels' CDN (free, no auth) and
 * have been spot-checked. Every entry is shaped to plug into the
 * eventual `products` schema (`kind`, `attributes`, variants).
 *
 * Once the DB is live, swap calls to `getDummyProductBySlug` /
 * `DUMMY_PRODUCTS` with the real `getProducts()` service.
 */

export type ProductKind =
  | "supplement"
  | "apparel"
  | "equipment"
  | "accessory";

export type SupplementCategory =
  | "protein"
  | "creatine"
  | "pre-workout"
  | "fat-burners"
  | "vitamins"
  | "mass-gainers"
  | "bcaa"
  | "recovery";

export interface ProductVariant {
  id: string;
  label: string;
  /** PKR */
  price: number;
  inStock: boolean;
}

export interface DummyProduct {
  slug: string;
  name: string;
  kind: ProductKind;
  /** Only set for `kind === "supplement"` */
  category?: SupplementCategory;
  /** Display label for the category chip */
  categoryLabel: string;
  flavor: string;
  /** Cheapest variant price, PKR */
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: "Bestseller" | "New" | "Sale" | "Low stock";
  /** Card accent — used in cart drawer + hover treatments */
  accent: string;
  /** ~120-160 chars marketing copy for cards */
  short: string;
  /** Long-form description for the PDP */
  description: string;
  /** Bullet specs for the PDP highlights panel */
  highlights: string[];
  /** Ingredient or material list */
  ingredients?: string[];
  /** Macro panel for supplements (per serving) */
  macros?: {
    servings: number;
    servingSize: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
  };
  variants: ProductVariant[];
  /** First image is the hero shot; rest power the PDP gallery */
  images: [string, ...string[]];
}

/** Pexels CDN helper — keeps URLs short and consistent. */
const pexels = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    slug: "iso-whey-pure-2kg",
    name: "Iso-Whey Pure",
    kind: "supplement",
    category: "protein",
    categoryLabel: "Protein",
    flavor: "Belgian Chocolate · 2kg",
    price: 8499,
    oldPrice: 9999,
    rating: 4.9,
    reviews: 412,
    badge: "Bestseller",
    accent: "#ff3b3b",
    short:
      "27g protein, 1g sugar, ultra-filtered isolate. Mixes clean in cold water with zero clumping.",
    description:
      "Iso-Whey Pure is a cold-cross-flow microfiltered whey protein isolate built for lifters who care about every gram. 27g of fast-absorbing protein per scoop, less than 1g of sugar, and naturally low in lactose so it sits easy even on sensitive stomachs. Third-party tested for purity at an ISO-17025 lab.",
    highlights: [
      "27g protein per 30g scoop",
      "Less than 1g sugar, lactose-friendly",
      "Instantised — mixes in cold water",
      "Third-party tested · 100% label accuracy",
    ],
    ingredients: [
      "Whey protein isolate (milk)",
      "Cocoa powder",
      "Natural & artificial flavour",
      "Sunflower lecithin",
      "Sucralose",
      "Acesulfame-K",
    ],
    macros: {
      servings: 66,
      servingSize: "30g (1 scoop)",
      calories: 120,
      protein: 27,
      carbs: 2,
      fat: 1,
      sugar: 1,
    },
    variants: [
      { id: "iso-whey-1kg", label: "1kg · 33 servings", price: 4799, inStock: true },
      { id: "iso-whey-2kg", label: "2kg · 66 servings", price: 8499, inStock: true },
      { id: "iso-whey-4kg", label: "4kg · 132 servings", price: 15499, inStock: false },
    ],
    images: [pexels(4046718, 1200), pexels(4498152, 900), pexels(3683101, 900)],
  },
  {
    slug: "creapure-mono-500g",
    name: "Creapure® Monohydrate",
    kind: "supplement",
    category: "creatine",
    categoryLabel: "Creatine",
    flavor: "Unflavored · 500g",
    price: 3299,
    rating: 4.95,
    reviews: 188,
    accent: "#00d4ff",
    short:
      "Pure German Creapure®. Micronised monohydrate, 100 servings of 5g — no taste, no grit.",
    description:
      "The most studied supplement in sports science, sourced from AlzChem in Germany — the gold-standard Creapure® raw. Micronised for fast dispersion and zero grit. Take 5g daily, training day or rest day, and let the saturation do the work.",
    highlights: [
      "100% Creapure® from Germany",
      "5g micronised dose, 100 servings",
      "Unflavored — stack into anything",
      "Vegan · banned-substance free",
    ],
    ingredients: ["Creapure® creatine monohydrate"],
    macros: {
      servings: 100,
      servingSize: "5g (1 tsp)",
      calories: 0,
    },
    variants: [
      { id: "creapure-300g", label: "300g · 60 servings", price: 2299, inStock: true },
      { id: "creapure-500g", label: "500g · 100 servings", price: 3299, inStock: true },
      { id: "creapure-1kg", label: "1kg · 200 servings", price: 5999, inStock: true },
    ],
    images: [pexels(3837344, 1200), pexels(4498151, 900), pexels(6551144, 900)],
  },
  {
    slug: "savage-pre-workout",
    name: "Savage Pre-Workout V2",
    kind: "supplement",
    category: "pre-workout",
    categoryLabel: "Pre-Workout",
    flavor: "Sour Watermelon · 30 servings",
    price: 4799,
    oldPrice: 5499,
    rating: 4.8,
    reviews: 267,
    badge: "New",
    accent: "#ffae00",
    short:
      "L-citrulline 8g · beta-alanine 3.2g · caffeine 250mg. Fully dosed, transparent label.",
    description:
      "Savage Pre-Workout V2 is built on clinical doses, not pixie dust. 8g of pure L-citrulline (not malate), 3.2g of beta-alanine for muscular endurance, 250mg of caffeine balanced with 200mg of L-theanine for clean, jitter-free focus. No proprietary blends — every ingredient is listed in mg.",
    highlights: [
      "8g L-citrulline · clinical pump dose",
      "3.2g beta-alanine for endurance",
      "250mg caffeine + 200mg L-theanine",
      "Zero proprietary blends",
    ],
    ingredients: [
      "L-citrulline",
      "Beta-alanine (CarnoSyn®)",
      "Betaine anhydrous",
      "Caffeine anhydrous",
      "L-theanine",
      "L-tyrosine",
      "Alpha-GPC",
      "Himalayan pink salt",
    ],
    macros: {
      servings: 30,
      servingSize: "16g (1 scoop)",
      calories: 5,
    },
    variants: [
      {
        id: "savage-watermelon",
        label: "Sour Watermelon · 30 servings",
        price: 4799,
        inStock: true,
      },
      {
        id: "savage-mango",
        label: "Mango Punch · 30 servings",
        price: 4799,
        inStock: true,
      },
      {
        id: "savage-blue",
        label: "Blue Raspberry · 30 servings",
        price: 4799,
        inStock: false,
      },
    ],
    images: [pexels(6551133, 1200), pexels(3998004, 900), pexels(3837344, 900)],
  },
  {
    slug: "omega3-1500",
    name: "Omega-3 1500mg",
    kind: "supplement",
    category: "vitamins",
    categoryLabel: "Vitamins",
    flavor: "120 softgels",
    price: 2499,
    rating: 4.85,
    reviews: 96,
    accent: "#a855f7",
    short:
      "High-EPA fish oil. Reflux-free, lemon-coated softgels. A 60-day daily supply.",
    description:
      "Pharmaceutical-grade molecularly distilled fish oil with 900mg combined EPA + DHA per 2-softgel serving. Enteric-coated to eliminate fishy reflux. IFOS 5-star tested for heavy metals, PCBs and oxidation.",
    highlights: [
      "900mg EPA + DHA per serving",
      "Enteric coated · zero reflux",
      "IFOS 5★ purity rating",
      "120 softgels · 60-day supply",
    ],
    ingredients: [
      "Fish oil concentrate",
      "Fish gelatin",
      "Glycerin",
      "Natural lemon oil",
      "Mixed tocopherols",
    ],
    macros: {
      servings: 60,
      servingSize: "2 softgels",
      calories: 20,
      fat: 2,
    },
    variants: [
      { id: "omega-60", label: "60 softgels", price: 1399, inStock: true },
      { id: "omega-120", label: "120 softgels", price: 2499, inStock: true },
      { id: "omega-240", label: "240 softgels", price: 4699, inStock: true },
    ],
    images: [pexels(6551144, 1200), pexels(9474061, 900), pexels(4046718, 900)],
  },
  {
    slug: "mass-builder-3000",
    name: "Mass Builder 3000",
    kind: "supplement",
    category: "mass-gainers",
    categoryLabel: "Mass Gainer",
    flavor: "Cookies & Cream · 3kg",
    price: 7299,
    oldPrice: 7999,
    rating: 4.7,
    reviews: 154,
    badge: "Sale",
    accent: "#22c55e",
    short:
      "1200 kcal of clean fuel per serve. Real oats, whey, MCT — no junk maltodextrin or sugar bombs.",
    description:
      "Built for hardgainers who actually want to eat their gains, not drink corn syrup. Each serving delivers 1200 quality calories from rolled oats, whey + casein blend, MCT oil and natural cocoa. 50g protein, 180g carbs, no added sugar, no soy.",
    highlights: [
      "1200 calories · 50g protein per serve",
      "Real oats, whey + casein, MCT oil",
      "No added sugar · no soy fillers",
      "Mixes thick but smooth",
    ],
    ingredients: [
      "Rolled oat flour",
      "Whey protein concentrate (milk)",
      "Micellar casein (milk)",
      "MCT oil powder",
      "Cocoa powder",
      "Digestive enzyme blend",
    ],
    macros: {
      servings: 12,
      servingSize: "250g (2 scoops)",
      calories: 1200,
      protein: 50,
      carbs: 180,
      fat: 18,
      sugar: 6,
    },
    variants: [
      { id: "mass-3kg", label: "3kg · 12 servings", price: 7299, inStock: true },
      { id: "mass-6kg", label: "6kg · 24 servings", price: 13499, inStock: true },
    ],
    images: [pexels(3683101, 1200), pexels(4753986, 900), pexels(4046718, 900)],
  },
  {
    slug: "ripped-burn",
    name: "Ripped Burn",
    kind: "supplement",
    category: "fat-burners",
    categoryLabel: "Fat Burner",
    flavor: "60 capsules",
    price: 3899,
    rating: 4.6,
    reviews: 88,
    accent: "#ff6b35",
    short:
      "Stim-free thermogenic. Green tea EGCG, L-carnitine, capsaicin — supports cuts without the jitters.",
    description:
      "Ripped Burn is a clean, stim-conservative thermogenic with 50mg natural caffeine from green tea (not coffee), 500mg L-carnitine tartrate, and 100mg capsimax for thermogenesis. Built to support a cut, not replace it.",
    highlights: [
      "Low-stim · 50mg natural caffeine",
      "500mg L-carnitine tartrate",
      "100mg capsimax · thermogenic",
      "0 banned substances",
    ],
    ingredients: [
      "Green tea extract (EGCG)",
      "L-carnitine tartrate",
      "Capsimax® (capsicum extract)",
      "Cayenne pepper",
      "Black pepper extract (BioPerine®)",
    ],
    macros: {
      servings: 30,
      servingSize: "2 capsules",
      calories: 5,
    },
    variants: [
      { id: "ripped-60", label: "60 capsules · 30 servings", price: 3899, inStock: true },
      { id: "ripped-120", label: "120 capsules · 60 servings", price: 6999, inStock: true },
    ],
    images: [pexels(9474061, 1200), pexels(4498151, 900), pexels(6551144, 900)],
  },
  {
    slug: "bcaa-recovery",
    name: "BCAA Recovery 2:1:1",
    kind: "supplement",
    category: "bcaa",
    categoryLabel: "BCAA",
    flavor: "Tropical Punch · 30 servings",
    price: 3499,
    rating: 4.55,
    reviews: 142,
    accent: "#00d4ff",
    short:
      "7g BCAAs in the proven 2:1:1 ratio plus 2.5g L-glutamine. Sip intra or post-session.",
    description:
      "Vegan-fermented BCAAs in the scientifically validated 2:1:1 ratio (3.5g leucine, 1.75g isoleucine, 1.75g valine) plus 2.5g of L-glutamine for recovery. Lightly sweetened with stevia and monkfruit, with added electrolytes for hydration.",
    highlights: [
      "7g BCAAs · 2:1:1 (3.5g leucine)",
      "2.5g L-glutamine for recovery",
      "Electrolyte blend · hydration",
      "Fermented · vegan-friendly",
    ],
    ingredients: [
      "L-leucine (fermented)",
      "L-isoleucine (fermented)",
      "L-valine (fermented)",
      "L-glutamine",
      "Coconut water powder",
      "Pink Himalayan salt",
      "Stevia",
      "Monkfruit extract",
    ],
    macros: {
      servings: 30,
      servingSize: "12g (1 scoop)",
      calories: 25,
      carbs: 1,
    },
    variants: [
      { id: "bcaa-tropical", label: "Tropical Punch", price: 3499, inStock: true },
      { id: "bcaa-grape", label: "Black Grape", price: 3499, inStock: true },
    ],
    images: [pexels(4498152, 1200), pexels(6551133, 900), pexels(3837344, 900)],
  },
  {
    slug: "zma-night-recovery",
    name: "ZMA Night Recovery",
    kind: "supplement",
    category: "recovery",
    categoryLabel: "Recovery",
    flavor: "90 capsules",
    price: 1999,
    rating: 4.7,
    reviews: 64,
    accent: "#a855f7",
    short:
      "Zinc + magnesium + B6 in the original Lonnie Lowery ratio. Take 30 minutes before bed.",
    description:
      "Classic ZMA in the original studied ratio: 30mg zinc monomethionine, 450mg magnesium aspartate, 10.5mg vitamin B6. Supports natural recovery, sleep quality and testosterone in deficient individuals. Take 30–60 minutes before bed on an empty stomach.",
    highlights: [
      "30mg zinc · 450mg magnesium · 10.5mg B6",
      "Original studied ratio",
      "Supports sleep + recovery",
      "90 capsules · 30-day supply",
    ],
    ingredients: [
      "Zinc monomethionine",
      "Magnesium aspartate",
      "Vitamin B6 (P-5-P)",
      "Vegetable capsule",
    ],
    macros: {
      servings: 30,
      servingSize: "3 capsules",
      calories: 0,
    },
    variants: [{ id: "zma-90", label: "90 capsules · 30 servings", price: 1999, inStock: true }],
    images: [pexels(4498151, 1200), pexels(6551144, 900), pexels(9474061, 900)],
  },
  {
    slug: "vegan-pea-protein",
    name: "Vegan Pea Protein",
    kind: "supplement",
    category: "protein",
    categoryLabel: "Protein",
    flavor: "Vanilla Bean · 1kg",
    price: 4999,
    rating: 4.5,
    reviews: 73,
    accent: "#22c55e",
    short:
      "24g of complete vegan protein per scoop. Smooth, no chalky aftertaste, no soy.",
    description:
      "A vegan blend built around European yellow pea isolate plus brown rice and pumpkin protein for a complete amino acid profile. 24g protein, 4g BCAAs naturally occurring, no soy, no gluten, no artificial sweeteners.",
    highlights: [
      "24g complete plant protein",
      "Pea + rice + pumpkin blend",
      "No soy · no gluten",
      "Stevia sweetened",
    ],
    ingredients: [
      "Pea protein isolate",
      "Brown rice protein",
      "Pumpkin seed protein",
      "Cocoa / vanilla powder",
      "Sunflower lecithin",
      "Stevia leaf extract",
    ],
    macros: {
      servings: 33,
      servingSize: "30g (1 scoop)",
      calories: 115,
      protein: 24,
      carbs: 3,
      fat: 1.5,
      sugar: 0,
    },
    variants: [
      { id: "vegan-vanilla", label: "Vanilla Bean · 1kg", price: 4999, inStock: true },
      { id: "vegan-choc", label: "Dutch Chocolate · 1kg", price: 4999, inStock: true },
    ],
    images: [pexels(4753986, 1200), pexels(4046718, 900), pexels(3683101, 900)],
  },
  {
    slug: "casein-night",
    name: "Casein Night Protein",
    kind: "supplement",
    category: "protein",
    categoryLabel: "Protein",
    flavor: "Strawberry Cream · 900g",
    price: 5499,
    rating: 4.8,
    reviews: 104,
    badge: "Low stock",
    accent: "#ff3b3b",
    short:
      "Slow-release micellar casein. 24g of protein over 6–8 hours — feeds muscle while you sleep.",
    description:
      "100% micellar casein — the slow-digesting milk protein that drip-feeds amino acids over 6–8 hours. Mix thick like a milkshake or stir into oats. 24g protein, just 2g carbs per serve, 30 servings per tub.",
    highlights: [
      "100% micellar casein",
      "24g protein, 6–8 hr release",
      "Mixes thick — great as pudding",
      "30 servings",
    ],
    ingredients: [
      "Micellar casein (milk)",
      "Cocoa / strawberry powder",
      "Sunflower lecithin",
      "Sea salt",
      "Sucralose",
    ],
    macros: {
      servings: 30,
      servingSize: "30g (1 scoop)",
      calories: 110,
      protein: 24,
      carbs: 2,
      fat: 1,
      sugar: 1,
    },
    variants: [
      {
        id: "casein-strawberry",
        label: "Strawberry Cream · 900g",
        price: 5499,
        inStock: true,
      },
      {
        id: "casein-choc",
        label: "Belgian Chocolate · 900g",
        price: 5499,
        inStock: false,
      },
    ],
    images: [pexels(3683101, 1200), pexels(4046718, 900), pexels(4498152, 900)],
  },
  {
    slug: "multi-daily",
    name: "Daily Multi · Athlete Formula",
    kind: "supplement",
    category: "vitamins",
    categoryLabel: "Vitamins",
    flavor: "60 tablets",
    price: 1799,
    rating: 4.6,
    reviews: 51,
    accent: "#a855f7",
    short:
      "All 23 essentials at 100% RDI, plus iron, zinc and magnesium dosed for hard trainers.",
    description:
      "A no-nonsense daily multivitamin tuned for athletes — 100% RDI of the 23 essentials, plus elevated doses of zinc, magnesium, vitamin D3 and B-complex to support training, immunity and recovery.",
    highlights: [
      "All 23 essential vitamins + minerals",
      "Athlete-dosed Zn / Mg / D3",
      "Methylated B-complex",
      "60 tabs · 30-day supply",
    ],
    ingredients: [
      "Vitamin A, C, D3, E, K2",
      "B-complex (methylated)",
      "Zinc, magnesium, iron, selenium",
      "Calcium, iodine, copper",
    ],
    macros: {
      servings: 30,
      servingSize: "2 tablets",
      calories: 5,
    },
    variants: [{ id: "multi-60", label: "60 tablets", price: 1799, inStock: true }],
    images: [pexels(6551144, 1200), pexels(9474061, 900), pexels(4498151, 900)],
  },
  {
    slug: "stim-free-pre",
    name: "Pump · Stim-Free Pre",
    kind: "supplement",
    category: "pre-workout",
    categoryLabel: "Pre-Workout",
    flavor: "Cherry Limeade · 25 servings",
    price: 4299,
    rating: 4.65,
    reviews: 79,
    accent: "#ffae00",
    short:
      "Zero caffeine. 8g citrulline + 3g GlycerPump® + 1.5g taurine for massive vasodilation.",
    description:
      "All pump, no stim. Stack it on top of your normal pre, take it for late evening sessions, or run it neat. 8g L-citrulline, 3g GlycerPump® (65% glycerol), 1.5g taurine, 3.2g beta-alanine — full label, full doses.",
    highlights: [
      "Zero caffeine — late session ready",
      "8g L-citrulline · 3g GlycerPump®",
      "3.2g beta-alanine",
      "Stack-friendly with any caf pre",
    ],
    ingredients: [
      "L-citrulline",
      "GlycerPump® (glycerol powder)",
      "Beta-alanine",
      "Taurine",
      "Sodium",
      "Potassium",
      "Magnesium",
    ],
    macros: {
      servings: 25,
      servingSize: "18g (1 scoop)",
      calories: 10,
    },
    variants: [
      { id: "pump-cherry", label: "Cherry Limeade", price: 4299, inStock: true },
      { id: "pump-pineapple", label: "Pineapple Coconut", price: 4299, inStock: true },
    ],
    images: [pexels(3998004, 1200), pexels(6551133, 900), pexels(3837344, 900)],
  },
  {
    slug: "tank-tee-iron",
    name: "Iron Tee — Heavyweight",
    kind: "apparel",
    categoryLabel: "Apparel",
    flavor: "Black · 280gsm cotton",
    price: 2999,
    rating: 4.7,
    reviews: 132,
    accent: "#ff3b3b",
    short:
      "Boxy, 280gsm ringspun cotton. Drop shoulder, dropped hem, classic Suppway chest mark.",
    description:
      "Garment-dyed 280gsm ringspun cotton tee built to outlive your PRs. Boxy fit, drop shoulder, dropped hem, raw-cut neck binding for that pre-washed feel. Embroidered chest mark, not printed — won't crack.",
    highlights: [
      "280gsm heavyweight cotton",
      "Boxy · drop shoulder cut",
      "Embroidered Suppway mark",
      "Garment-dyed · pre-shrunk",
    ],
    variants: [
      { id: "tee-s", label: "Small", price: 2999, inStock: true },
      { id: "tee-m", label: "Medium", price: 2999, inStock: true },
      { id: "tee-l", label: "Large", price: 2999, inStock: true },
      { id: "tee-xl", label: "X-Large", price: 2999, inStock: true },
      { id: "tee-xxl", label: "XX-Large", price: 3299, inStock: false },
    ],
    images: [pexels(1552252, 1200), pexels(2294361, 900), pexels(1431282, 900)],
  },
  {
    slug: "kb-16kg",
    name: "Cast-Iron Kettlebell 16kg",
    kind: "equipment",
    categoryLabel: "Equipment",
    flavor: "16kg · powder coated",
    price: 7999,
    rating: 4.85,
    reviews: 67,
    accent: "#22c55e",
    short:
      "Single-piece gravity-cast iron. Smooth, chip-resistant powder coat. Wide handle for two-hand swings.",
    description:
      "Single-piece gravity-cast iron — no welds, no seams, no surprises. Matte powder coat for chalk to actually grip. Wide handle accommodates two-hand swings and the bell base is flat for renegade rows and push-ups.",
    highlights: [
      "Single-piece gravity-cast iron",
      "Matte powder coat — chalk friendly",
      "Wide handle for two-hand swings",
      "Color-coded by weight",
    ],
    variants: [
      { id: "kb-8", label: "8kg", price: 4799, inStock: true },
      { id: "kb-12", label: "12kg", price: 6299, inStock: true },
      { id: "kb-16", label: "16kg", price: 7999, inStock: true },
      { id: "kb-20", label: "20kg", price: 9499, inStock: true },
      { id: "kb-24", label: "24kg", price: 11299, inStock: false },
    ],
    images: [pexels(3768593, 1200), pexels(8844883, 900), pexels(4720265, 900)],
  },
  {
    slug: "lifting-belt-10mm",
    name: "Suede Lifting Belt 10mm",
    kind: "accessory",
    categoryLabel: "Accessory",
    flavor: "Black suede · 10mm",
    price: 6499,
    oldPrice: 7499,
    rating: 4.9,
    reviews: 211,
    badge: "Bestseller",
    accent: "#ffae00",
    short:
      "IPF-spec 10mm suede leather. Single-prong roller buckle, broken-in feel out of the box.",
    description:
      "Hand-cut single-ply suede leather, 10mm thick, 10cm wide — IPF-spec for raw lifting. Solid stainless single-prong roller buckle. Edges sealed and stitched in heavy-duty thread. Comes broken-in: no wrestling on day one.",
    highlights: [
      "10mm · 10cm wide (IPF spec)",
      "Single-prong stainless buckle",
      "Pre-broken-in suede leather",
      "Lifetime stitching warranty",
    ],
    variants: [
      { id: "belt-s", label: "Small (66–82cm)", price: 6499, inStock: true },
      { id: "belt-m", label: "Medium (76–96cm)", price: 6499, inStock: true },
      { id: "belt-l", label: "Large (89–108cm)", price: 6499, inStock: true },
      { id: "belt-xl", label: "X-Large (100–120cm)", price: 6999, inStock: false },
    ],
    images: [pexels(8957061, 1200), pexels(3825586, 900), pexels(3735780, 900)],
  },
  {
    slug: "wrist-wraps-pro",
    name: "Pro Wrist Wraps",
    kind: "accessory",
    categoryLabel: "Accessory",
    flavor: "60cm · stiff weave",
    price: 1799,
    rating: 4.7,
    reviews: 88,
    accent: "#00d4ff",
    short:
      "IPF-legal 60cm stiff cotton-elastane weave. Thumb loop + velcro lock — heavy bench ready.",
    description:
      "60cm stiff cotton-elastane weave — the stiffness lifters actually want for heavy benching, OHP and lockouts. Thumb loop locks them in, double-stitched velcro doesn't peel. IPF-legal length.",
    highlights: [
      "60cm · stiff competition weave",
      "Thumb loop + heavy velcro",
      "IPF-legal length",
      "Pair (left + right)",
    ],
    variants: [
      { id: "wraps-60", label: "60cm (stiff)", price: 1799, inStock: true },
      { id: "wraps-90", label: "90cm (very stiff)", price: 1999, inStock: true },
    ],
    images: [pexels(3735780, 1200), pexels(3825586, 900), pexels(1552252, 900)],
  },
];

const PRODUCTS_BY_SLUG: Record<string, DummyProduct> = Object.fromEntries(
  DUMMY_PRODUCTS.map((p) => [p.slug, p]),
);

export function getDummyProductBySlug(slug: string): DummyProduct | undefined {
  return PRODUCTS_BY_SLUG[slug];
}

export function getDummyProductsByCategory(category: SupplementCategory) {
  return DUMMY_PRODUCTS.filter((p) => p.category === category);
}

export function getDummyProductsByKind(kind: ProductKind) {
  return DUMMY_PRODUCTS.filter((p) => p.kind === kind);
}

/** Sorted bestseller picks — drives Bestsellers section + featured rails. */
export function getDummyBestsellers(limit = 4) {
  return [...DUMMY_PRODUCTS]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, limit);
}

/** PKR formatter shared across cards / drawer / PDP / checkout. */
export function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}
