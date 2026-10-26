# Lotus Fitness Gym

A responsive public-facing website and installable PWA for Lotus Gym in Tirana, built with Next.js App Router, React, and TypeScript.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validate with `npm run lint` and `npm run build`.

Copy `.env.example` to `.env.local` to configure optional public listing overrides and the contact form. Never commit `.env.local` or put server credentials in `NEXT_PUBLIC_` variables.

## Existing architecture

- **Web/PWA:** Next.js App Router, server-rendered public pages, manifest, and a service worker for basic offline shell caching.
- **Public contact delivery:** `/api/contact` validates form data and sends email through Resend only when configured with a server-side API key, a verified sender, and the gym's real receiving inbox.
- **Backend/auth/database:** None is configured. There is no Supabase/PostgreSQL connection, member authentication, private member data, or admin dashboard in this project.
- **Native app:** No Expo/iOS/Android project or EAS build setup is present.

## Verified Lotus Gym information

The website uses the supplied business name, Tirana address, phone number, and Plus Code. The map link is a Google Maps search URL built from the supplied address and Plus Code; no coordinates or paid Maps API key are required. The supplied 3.9 rating and 42 reviews are labeled as manually entered from a screenshot, not as a live Google integration. The only supplied hours detail is a 10:00 PM closing time; opening times and days are explicitly unconfirmed.

The rating can be changed or hidden with `NEXT_PUBLIC_LOTUS_RATING_VALUE`, `NEXT_PUBLIC_LOTUS_REVIEW_COUNT`, and `NEXT_PUBLIC_LOTUS_RATING_VISIBLE=false`. The displayed hours note can be changed with `NEXT_PUBLIC_LOTUS_HOURS_NOTE`. These static settings are build/deployment configuration, not an admin dashboard.

## Contact form setup

Set these server-only environment variables using the gym's real details:

- `RESEND_API_KEY`: Resend API key.
- `CONTACT_INBOX`: an authorized Lotus Gym inbox.
- `CONTACT_FROM_EMAIL`: a sender address verified with Resend.

Until all three are configured, the form is disabled and the API returns `503`; submissions are not reported as sent. When configured, the API validates and delivers messages, but does not store them in a database. Configure production rate limiting/abuse controls at the hosting edge before accepting public submissions.

## Not yet production-ready

Services, membership plans/prices, classes, and opening schedules have not been supplied, so their pages direct visitors to call rather than claim unverified offerings. The Login page is an explicit notice, not a fake login. There is no member booking, payment, auth, staff/admin dashboard, secure database storage, trainer directory, or native app yet. Privacy and terms pages are clearly marked as not yet provided and need owner/legal review. Replace the illustrative Unsplash hero photo with licensed, gym-approved imagery before launch.
