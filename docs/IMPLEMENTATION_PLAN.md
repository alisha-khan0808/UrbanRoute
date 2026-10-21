# Implementation plan & status

Source of truth: `Urban_Route_NZ_PRD_Claude.md`. Status as of 21 Oct 2026.

## Acceptance criteria (PRD §12)

| Criterion | Status |
|---|---|
| Home 3D world loads with seven service hotspots | Done — procedural world; verified on desktop and mobile emulation |
| Hotspot click animates camera and opens correct service info | Done |
| Standard menu and static/reduced-motion alternatives | Done |
| Seven SEO-indexable service pages (scope, process, related, CTA) | Done — SSG with metadata, canonical URLs, JSON-LD |
| Coverage map includes all twelve named areas | Done — 3D + 2D + list; covered by a unit test |
| Enquiries validate, store securely, appear in admin | Done (local store verified end-to-end) |
| Private attachments not anonymously accessible | Done — anonymous requests get 401; files stored outside `public/` |
| Admin can edit, preview, publish and restore content | Done (local store verified in browser) |
| Admin can update regions and 3D preset/hotspot settings (P1) | Done |
| Responsive on desktop and mobile | Done — checked at 1280×800 and 375×812 |
| Production deployment, monitoring and backups verified | **Not done** — needs hosting, Supabase project and monitoring accounts |

## Phases

1. Foundation — Next.js app, content schemas, data-store abstraction, Supabase migration with RLS ✅
2. 3D proof of concept → seven zones, camera paths, hotspots, overlay, fallbacks ✅
3. Public pages, enquiry flow, coverage map ✅
4. Admin CMS — draft/preview/publish, enquiries, media, SEO, history/audit, scenes ✅
5. QA — unit tests (validation, authorisation, publishing workflow, storage, CSV), lint, type-check, build ✅. Still to do: Playwright e2e, accessibility audit, Lighthouse on real devices.
6. Launch — domain, Vercel, Supabase production, backups, monitoring, content sign-off ⏳

## Open questions for Urban Route NZ (PRD §15)

- Final logo, brand colours, typography
- Contact email/phone, enquiry recipient, domain
- Approved experience wording and region descriptions
- Deliverables/FAQ wording and approval responsibilities per service
- Case studies, testimonials, real project imagery
- Admin users and publishing approval workflow (who can publish?)
- Budget/approach for original Blender assets
