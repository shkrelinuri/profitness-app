# ProFitness Training Club

A responsive public gym website built with Next.js App Router, React, TypeScript, and Tailwind CSS. It includes a web-app manifest and a small service worker for an installable PWA shell.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run lint` and `npm run build` to validate changes.

## Architecture

- **Web and PWA:** Next.js App Router renders public pages and provides metadata, the web manifest, and service-worker assets.
- **Backend (next phase):** Supabase Auth and PostgreSQL are the recommended shared backend. Enable row-level security on every member-owned table; keep privileged service-role credentials server-side only. Use Supabase Storage policies for private member uploads.
- **Native apps (next phase):** Expo/React Native can consume the same Supabase project and typed business contracts. Keep shared validation and domain logic in a small workspace package only when native workflows are added, rather than duplicating a second API.
- **Secrets:** Never put credentials in source control. When Supabase integration is added, expose only the project URL and anon/publishable key to clients; privileged keys belong in server-only environment variables.

## Current scope and content setup

The current implementation is the public home page from the supplied brief. Membership, location, hours, email, and review content are intentionally generic because no real club details or verified reviews were supplied. Replace the example contact address (`hello@profitness.example`) and location copy before launch. The membership link starts an email enquiry; it does not create a membership or charge a customer.

The service worker caches the app shell and same-origin static resources for basic offline reopening. Photography is served from Unsplash and therefore requires a network connection. A production launch should use approved, locally hosted/licensed imagery, real club details, privacy/terms pages, and the remaining authenticated/member and staff workflows.
