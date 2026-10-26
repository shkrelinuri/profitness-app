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
  plusCode: "8RP8+4J Tirane, Albania",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Bulevardi%20Zogu%20I%201%2C%20Qendra%20Trektare%20Tirana%20%28QTT%29%2C%20kati%20i%20dyte%2C%20Tirana%2C%201001%2C%20Albania%208RP8%2B4J%20Tirane%2C%20Albania",
  hoursNote:
    process.env.NEXT_PUBLIC_LOTUS_HOURS_NOTE?.trim() ||
    "The supplied listing shows a 10:00 PM closing time. Opening times and the weekly schedule have not been confirmed; please call before visiting.",
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
