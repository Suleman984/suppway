/**
 * Demo brand identity for the landing page. Kept as constants so the
 * storefront renders without any DB connection — useful for client demos
 * before the admin has populated `store_settings`.
 */
export const BRAND = {
  name: "suppway",
  shortName: "Suppway",
  tagline: "Train brutal. Recover smart. Look the part.",
  whatsapp: "+92 300 1234567",
  email: "hello@suppway.com",
  city: "Lahore, Pakistan",
  founded: 1789,
  social: {
    instagram: "https://instagram.com/suppway",
    youtube: "https://youtube.com/@suppway",
    tiktok: "https://tiktok.com/@suppway",
  },
} as const;
