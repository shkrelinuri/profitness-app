const configuredRating = process.env.NEXT_PUBLIC_LOTUS_RATING_VALUE?.trim();
const configuredReviewCount = process.env.NEXT_PUBLIC_LOTUS_REVIEW_COUNT?.trim();
const ratingValue = configuredRating ? Number(configuredRating) : 3.9;
const reviewCount = configuredReviewCount ? Number(configuredReviewCount) : 42;

export const gym = {
  name: "Lotus Gym",
  brandName: "Lotus Fitness Gym",
  category: "Gym / Fitness Center",
  address: {
    street: "Bulevardi Zogu I 1",
    building: "Qendra Trektare Tirana (QTT), kati i dyte",
    city: "Tirana",
    postalCode: "1001",
    country: "Albania",
    full: "Bulevardi Zogu I 1, Qendra Trektare Tirana (QTT), kati i dyte, Tirana, 1001, Albania",
  },
  phone: {
    display: "+355 69 305 5396",
    href: "+355693055396",
  },
  mapsUrl:
    "https://www.google.com/maps/place/Lotus+Gym/@41.3353451,19.8166053,17z/data=!3m1!4b1!4m6!3m5!1s0x135031e70ac44c99:0x266f4a5e5615b55f!8m2!3d41.3353451!4d19.8166053!16s%2Fg%2F11h5n5d6cq?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=41.3353451%2C19.8166053&z=17&output=embed",
  hoursNote: "Mon–Sat: 9:00 AM–11:00 PM · Sun: 9:00 AM–4:00 PM",
  rating: {
    value: Number.isFinite(ratingValue)
      ? Math.min(5, Math.max(0, ratingValue))
      : 3.9,
    reviewCount: Number.isInteger(reviewCount) ? Math.max(0, reviewCount) : 42,
    sourceNote:
      "Manually entered from the supplied screenshot; this is not a live Google rating.",
    visible: process.env.NEXT_PUBLIC_LOTUS_RATING_VISIBLE !== "false",
  },
} as const;

export const siteNavigation = [
  { label: "Services", href: "/services" },
  { label: "Memberships", href: "/memberships" },
  { label: "Schedule", href: "/schedule" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
