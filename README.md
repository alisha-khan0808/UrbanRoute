# Urban Route NZ — website, 3D explorer & CMS

Next.js 14 (App Router) + TypeScript + Tailwind + React Three Fiber, with Supabase for content, enquiries, auth and storage. Built from [`Urban_Route_NZ_PRD_Claude.md`](Urban_Route_NZ_PRD_Claude.md).

> **Placeholders:** logo, contact details, experience wording, deliverables, FAQs and the privacy notice are drafted placeholders and must be confirmed by Urban Route NZ (PRD §4, §15). All are editable in the admin panel.

## Quick start (local, no Supabase needed)

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET and LOCAL_ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Without Supabase variables, the app uses a **local file store** in `.data/` (git-ignored). Uploaded enquiry files go to `.data/private/`, which is never publicly served. Admin login at `/admin/login` uses `LOCAL_ADMIN_*` / `LOCAL_EDITOR_*` from `.env.local`. Local login is **refused in production** unless `ALLOW_LOCAL_ADMIN=true`.

> Node 18.17 is supported (Next 14). Node 20+ is recommended for production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` · `npm test` | ESLint · `tsc` · Vitest unit tests |
| `npm run check` | All of the above + build |

## What's included

**Public site** (`src/app/(site)`)
- `/` — HTML hero renders immediately. The 3D world loads lazily after idle, with an aerial intro descent, 7 hotspots, camera flights along curved paths, and a service overlay (process, CTA, full-page link, previous/next, back to overview). Includes a skip-intro button, a reduced-motion toggle (also honours the OS setting), a static view, keyboard navigation (arrows / Esc, plus an HTML service rail), a fallback if WebGL is missing or lost, and the `/?explore=<slug>` deep link.
- `/services`, `/services/[slug]` — SSG, SEO metadata, canonical URLs, JSON-LD. Each has scope, deliverables, step-by-step process, QS specialisms, FAQ, related services, CTA, and a lazy 3D scene with an SVG fallback. The QS scene has selectable drainage/roofing/tanking layers.
- `/coverage` — extruded 3D NZ map plus a 2D SVG map and an accessible list of all 12 areas. Separates "prior experience" from "service available", with a non-endorsement notice.
- `/contact` — enquiry form with conditional TMP / QS / event fields, file attachments, and consent.
- `/about`, `/privacy`, `sitemap.xml`, `robots.txt`, 404.
- Mobile: hamburger menu, bottom-sheet overlay, portrait-specific camera and FOV, horizontally scrolling service rail, responsive admin.

**Enquiry pipeline** (`/api/enquiries`)
zod validation (server-side, including conditional fields) → per-IP rate limit → honeypot + minimum fill time → file type/size/count checks plus magic-byte sniffing → stored with a reference `UR-YYYY-XXXXXX` → private file storage → admin email (Resend) → optional acknowledgement email.

**Admin** (`/admin`)
- Dashboard: enquiry counts by status, recent leads, drafts awaiting publish.
- Enquiries: search/filter, status (New → Closed), notes, protected downloads, CSV export (formula-injection safe).
- Pages / Services / Coverage / Settings: schema-driven forms, **save draft → preview (Next draft mode) → publish**, section ordering.
- 3D scenes (P1): enable, intro, default quality, optional GLB URL, hotspot labels/destinations, approved camera presets.
- Media library (upload, replace, alt text, remove), SEO editor, history (revisions with restore) and audit log.

Roles: **Super Admin** (everything), **Editor** (edit, publish, manage enquiries, upload media), **Reviewer** (read-only). Enforced in every server action and route handler (`src/lib/auth`), and in Supabase by RLS.

## Architecture

```
src/
  app/(site)/…            public pages (SSR/SSG)
  app/admin/…             admin UI + server actions (actions.ts)
  app/api/…               enquiries, protected files, CSV, preview, media
  components/three/       ExperienceCanvas, SceneManager, CameraController,
                          HotspotManager, PerformanceManager (in ExperienceCanvas),
                          World, zones/*, primitives (instancing helpers)
  components/home/        HomeExperience, ContentOverlay, StaticExplorer
  components/cms/         CMSRenderer (page sections)
  lib/content/            zod schemas + seed content
  lib/data/               DataStore interface, LocalStore, SupabaseStore
  lib/enquiry/            schema, processing, notifications
supabase/migrations/      SQL schema, RLS, storage buckets
tests/                    Vitest unit tests
```

**Content model.** Every editable entity (service, region, page, scene, settings) is a validated JSON document with `draft` and `published` versions, plus revision history. This simplifies the PRD's suggested schema (§9) into one uniform draft/publish/restore mechanism. Anything not yet in the database falls back to the seed content in `src/lib/content/defaults.ts`, so the site always renders. A Super Admin can copy the seed into the database with **Dashboard → Seed built-in content**.

**3D pipeline.** No GLB assets were supplied, so the world is built procedurally from primitives in code. Repeated objects (cones, cars, trees, crowds, barriers, buildings) use `InstancedMesh`, and moving agents run along polylines in a single draw call each. Quality presets (`low`/`medium`/`high`) control DPR, shadows and agent density. They are auto-detected from the device and stepped down at runtime by drei's `PerformanceMonitor`. To use Blender-produced assets, export optimised glTF/GLB (Draco/Meshopt, KTX2 textures) and either set **3D scenes → GLB model URL** or swap a zone component in `SceneManager.tsx` for `useGLTF`.

## Supabase setup (preview / production)

1. Create a project. Run `supabase/migrations/0001_init.sql` (`supabase db push` or the SQL editor). This creates the tables, RLS policies, a `published_content` view and the storage buckets (`enquiry-files` private, `media` public).
2. Set the environment variables (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **server-only** `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is used only in server code: inserting validated enquiries, and creating 60-second signed download URLs after a role check.
3. **Provision admins:** invite the user in Supabase Auth. A `profiles` row is created automatically with role `reviewer`. Promote them in SQL:
   `update profiles set role = 'super_admin' where email = 'name@company.co.nz';`
4. Sign in at `/admin/login`, then click **Seed built-in content** on the dashboard.

> The Supabase adapter (`src/lib/data/supabase-store.ts`) is written against the migration but **has not been run against a live Supabase project yet**. Run through the admin flows once on staging before launch.

## Environment variables

See [`.env.example`](.env.example). Never commit `.env.local`. `RESEND_API_KEY` + `ENQUIRY_FROM_EMAIL` + `ENQUIRY_NOTIFY_TO` enable email; otherwise notifications are logged to the server console. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` enables analytics. Tracked events: hotspot clicks, service views, CTA clicks, form start/submit, coverage selection and 3D fallback. Enquiry contents are never tracked.

## Deployment (Vercel preferred)

Import the repo and set the env vars per environment (Preview → staging Supabase project, Production → production project). Set `NEXT_PUBLIC_SITE_URL` to the real domain so canonical URLs and the sitemap are correct. Also enable Supabase daily backups/PITR and add error monitoring (e.g. Sentry) before launch.

## Known limitations / next steps

- **Rate limiting** is in-memory (per instance). On Vercel, switch to a shared store such as Upstash Redis or a Supabase table.
- 3D assets are procedural placeholders. Final art direction and Blender assets are still to be produced (PRD §15).
- Contact details, experience claims, deliverables, FAQs and the privacy notice are placeholders pending approval and an NZ Privacy Act 2020 review (including a data-retention period).
- Not yet done: Supabase adapter verification, end-to-end browser tests (e.g. Playwright), a formal WCAG 2.2 AA audit, Lighthouse/Core Web Vitals measurement on real devices, role invitations UI (P1), analytics dashboard (P1), case studies (P2).
- Tablets around 800 px wide show the hero copy over a busy scene. Consider hiding the hero body text at that size after design review.
