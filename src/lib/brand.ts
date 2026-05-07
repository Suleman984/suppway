/**
 * Demo brand identity for the landing page. Kept as constants so the
 * storefront renders without any DB connection — useful for client demos
 * before the admin has populated `store_settings`.
 */
export const BRAND = {
  name: "thefitnesshub1789",
  shortName: "Fitness Hub",
  tagline: "Train brutal. Recover smart. Look the part.",
  whatsapp: "+92 300 1234567",
  email: "hello@thefitnesshub1789.com",
  city: "Lahore, Pakistan",
  founded: 1789,
  social: {
    instagram: "https://instagram.com/thefitnesshub1789",
    youtube: "https://youtube.com/@thefitnesshub1789",
    tiktok: "https://tiktok.com/@thefitnesshub1789",
  },
} as const;
