# Lotus Fitness Gym

A responsive Lotus Gym website and installable PWA, member-account foundation, staff dashboard, and Expo iOS/Android member app.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validate the website with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

The Expo app is in `apps/mobile`. Install its dependencies and configure its public Supabase environment variables before running:

```bash
cd apps/mobile
npm install
npm start
```

The native app supports verified email/password accounts and displays the member's database-backed membership summary. It never grants access based on a card identifier and cannot unlock the physical door.

The mobile dependency audit currently reports unresolved transitive advisories in the Expo SDK 58 tooling tree. `npm audit fix` updates compatible packages, but npm's remaining automatic remediation would downgrade Expo to SDK 51; do not apply that forced downgrade. Review the audit again when Expo publishes compatible fixes and before store submission.

## Architecture and setup

- **Website/PWA:** Next.js App Router, React, TypeScript, server-rendered public pages, manifest, and offline shell caching.
- **Native app:** Expo / React Native with Supabase Auth and SecureStore-backed session persistence.
- **Authentication and database:** Supabase Auth and PostgreSQL. Apply the migrations in `supabase/migrations` in filename order using the Supabase SQL editor or a reviewed deployment workflow.
- **Public environment:** Copy `.env.example` to `.env.local` for Next.js. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin for staff invitations. For Expo, copy `apps/mobile/.env.example` to `apps/mobile/.env`. The Supabase URL and anon/publishable key are public client configuration; database row-level security and server-side authorization remain mandatory.
- **Server secret:** Configure `SUPABASE_SERVICE_ROLE_KEY` only in the trusted server environment for staff invitations and trusted membership synchronization. Never put it in a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` variable, source control, or a mobile build.
- **Email:** Configure Supabase email verification, password reset, and redirect URLs for the deployed website. Staff roles must be provisioned by a trusted administrator; registration creates only a member account.
- **Initial staff access:** Provision the first staff/admin role through a trusted, audited database administration process. Never let a member edit their own role.
- **Contact delivery:** `/api/contact` sends validated submissions to Formspree using the server-side `FORMSPREE_FORM_ID`. Create a Formspree account and form, then add its form ID to `.env.local` and the deployment environment. Until configured, the website form stays disabled. The form ID is not a secret, but keeping it server-side lets the application validate submissions and apply its spam checks before forwarding them.

## Maksisoft integration status

Maksisoft remains authoritative for membership and physical entrance access. Public product information was reviewed, but no official API documentation, SDK, authorized integration method, or credentials were available. The project therefore includes only an unconfigured adapter boundary; it does not invent provider endpoints or send provider requests.

Staff can link a verified Lotus account to a stable external Maksisoft member identifier. Membership synchronization and digital privileges remain unavailable until Maksisoft supplies an authorized method and the gym configures it. Physical card records and staff operations are retained in the database; no card identifier is used as web/app login proof, and no door-control integration is implemented.

Before enabling sync, obtain and review Maksisoft's written integration documentation, permitted member identifier semantics, authentication and credential-rotation procedure, membership/status/privilege field mapping, rate limits, retry guidance, and any webhook or polling rules. Confirm that the gym is authorized to access and store each field. Configure server-only credentials and test against a vendor-approved environment before enabling the adapter.

## Business information and launch requirements

The website uses the supplied Lotus Gym name, Tirana address, phone number, and Plus Code. Opening hours, services, class schedules, membership plans/prices, policies, and some ratings were not independently verified; pages avoid presenting missing details as facts. Contact the gym for current information.

Before production launch, the owner should review the privacy policy and terms, provide verified business/membership information, replace illustrative imagery with licensed gym-approved assets, configure Supabase and email delivery, provision staff securely, and complete security/privacy review for the actual deployment.
