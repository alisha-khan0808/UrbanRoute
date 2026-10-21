# Urban Route NZ — Product Requirements Document (PRD)

**Version:** 1.1  
**Date:** 21 October 2026  
**Implementation:** Claude Code  
**Stack:** Next.js, TypeScript, Node.js, Supabase, Three.js / React Three Fiber, Tailwind CSS, Vercel (preferred) or Netlify

## 1. Overview

Urban Route NZ is a New Zealand consultancy serving civil contractors, utilities, councils, and event organisers. It provides temporary traffic management planning, quantity surveying, project coordination and traffic impact assessments nationwide. The business has experience across 12+ councils and road controlling authorities (RCAs) in the North and South Islands and with NZTA Waka Kotahi.

Build a premium, immersive 3D website in which visitors travel between animated infrastructure scenes by clicking hotspots. The aesthetic should combine clean isometric miniature infrastructure environments (roads, vehicles, buildings, cones, drainage, event venues) with cinematic architectural lighting and smooth camera transitions, inspired by the supplied reference screenshots. The website must also work without 3D.

### Goals
- Present seven services and the company's geographic experience.
- Generate qualified project enquiries and document uploads.
- Offer an accessible, mobile-friendly, SEO-indexable browsing experience.
- Enable nontechnical administrators to manage site content, coverage, leads, and prebuilt 3D scene configurations.

### Audiences
Civil contractors, utility companies, councils/RCAs, event organisers, developers and construction companies.

## 2. Design and interaction

**Visual direction:** Professional, contemporary, engineering-led; warm off-white `#F7F8F6`, charcoal `#17232B`, orange `#FF6542`, teal `#21B7AA`; Manrope or Inter typography. The 3D world is a stylised isometric NZ infrastructure landscape with roads, buildings, construction equipment, signage and traffic.

**Homepage journey:**
1. Show a lightweight hero immediately, then progressively load the 3D world.
2. Animate an aerial camera descent into the infrastructure environment.
3. Display seven clearly labelled clickable hotspots for the services.
4. On click, highlight the selected location, animate the camera along a predetermined path, then reveal a service overlay with description, process and CTA.
5. Allow the visitor to enter the full service page, navigate to another hotspot, or return to the overview.
6. Provide visible standard navigation, skip-animation control, reduced-motion mode, keyboard-accessible alternatives, and a static fallback.

**3D requirements:** Reusable assets; glTF/GLB models; compressed textures; instancing for repeated cones/vehicles; lazy loading; responsive quality presets; camera presets and paths; scene-to-service hotspot mapping. Essential text and controls must be HTML, not solely embedded in a WebGL canvas. Do not build a full 3D editor in v1.

## 3. Site map

| Path | Description |
|---|---|
| `/` | Interactive 3D homepage |
| `/services` | All seven services and exploration links |
| `/services/traffic-management-plans` | TMPs |
| `/services/site-specific-tmps` | Site-specific TMPs |
| `/services/event-traffic-management` | Event traffic management |
| `/services/on-call-advisory` | On-call advisory |
| `/services/quantity-surveying` | Quantity surveying |
| `/services/project-coordination` | Project coordination |
| `/services/traffic-impact-assessments` | TIA |
| `/coverage` | NZ coverage map |
| `/about` | Business and experience |
| `/contact` | General enquiry |
| `/privacy` | Privacy notice |
| `/admin` | Protected CMS and lead dashboard |

Each service page must include hero, scope, deliverables, step-by-step process, 2–3 related services, service-specific CTA, optional FAQ, SEO metadata and a relevant 3D scene or fallback image.

## 4. Service content and processes

### 01 — Traffic Management Plans (TMPs)
**Scope:** TMP and traffic management diagram (TMD) preparation for road-adjacent works such as trenching, drainage, utility works, footpaths, crossings and lane closures. Cover cone tapers, signage, temporary speed limits, Stop/Go, staging, pedestrian routes and submission/approval support.

**Process:** Requirements → Site review → TMP/TMD preparation → Review → RCA submission → Feedback/amendments.  
**3D:** Roadworks, lane closure, cones, signs and animated traffic.  
**CTA:** Request a TMP.  
**Related:** Site-Specific TMPs; On-Call Advisory; Project Coordination.

### 02 — Site-Specific TMPs
**Scope:** Design for actual site conditions: road width, volumes, intersections, driveways, cyclists, public transport, plant movements and construction method.

**Process:** Site information → Constraints → Site-specific design → TMD → Review → Submission support.  
**3D:** Intersection with pedestrians, cyclists, driveways and construction vehicles.  
**CTA:** Discuss Your Site.  
**Related:** TMPs; On-Call Advisory; TIA.

### 03 — Event Traffic Management
**Scope:** Road closures, pedestrian/crowd routes, parking, emergency access, temporary signs and coordination with councils and stakeholders.

**Process:** Event brief → Access/traffic assessment → Event plan → Stakeholder coordination → Readiness → Event-day support as agreed.  
**3D:** Market/festival with barriers, crowd movement, parking and emergency routes.  
**CTA:** Discuss Your Event.  
**Related:** TMPs; Project Coordination; On-Call Advisory.

### 04 — On-Call Advisory
**Scope:** Practical technical advice on changing site conditions, methods, RCA feedback, TMD amendments, schedules and compliance queries.

**Process:** Raise issue → Review constraints → Recommend solution → Revise documents if needed → Coordinate next steps.  
**3D:** Construction site with revised traffic plan overlays.  
**CTA:** Request Technical Advice.  
**Related:** TMPs; Site-Specific TMPs; Project Coordination.

### 05 — Quantity Surveying (QS)
**Scope:** Quantity take-offs, bills of quantities (BOQs), materials, labour, plant, cost build-ups and tenders/quotations.

**Specialisms:**
- Drainage QS: pipes, manholes, excavation, bedding, backfill and reinstatement.
- Roofing QS: roof areas, membranes, flashings, gutters and downpipes.
- Tanking & Waterproofing QS: below-ground membranes, retaining walls and foundations.

**Process:** Drawings → Take-off → BOQ → Cost build-up → Quotation.  
**3D:** Interactive building cutaway with selectable drainage, roofing and waterproofing layers.  
**CTA:** Request a QS Quote.  
**Related:** Project Coordination; Site-Specific TMPs.

### 06 — Project Coordination
**Scope:** Coordinate client, designers, contractors, traffic management, QS, council approvals, programme, site teams and documentation.

**Process:** Scope → Planning → Approvals → Readiness → Traffic management → Site delivery → Changes → Completion → Handover.  
**3D:** Construction site progressing through project stages.  
**CTA:** Discuss Your Project.  
**Related:** TMPs; QS; On-Call Advisory.

### 07 — Traffic Impact Assessments (TIA)
**Scope:** Assess site access, traffic generation, intersections, parking, pedestrians, servicing/loading and access safety for proposed developments.

**Process:** Development brief → Existing conditions → Traffic assessment → Impact analysis → Recommendations → TIA report.  
**3D:** Development/intersection with vehicle-flow overlays.  
**CTA:** Request a Traffic Assessment.  
**Related:** Site-Specific TMPs; Project Coordination.

*Technical process wording and any approval responsibilities must be confirmed by Urban Route NZ before publication.*

## 5. Coverage map

Show a 3D stylised New Zealand map, plus a usable conventional/map or list fallback. Include:

**North Island:** Auckland; Hamilton/Waikato; Waipā; Matamata-Piako; Waitomo; Taupō; Ruapehu.

**South Island:** Christchurch; Buller; West Coast; Westland; Invercargill.

On selection, highlight the region and show its name, CMS-managed description and enquiry CTA. Distinguish nationwide service availability from documented prior experience. Do not imply council or NZTA endorsement. Region markers may be representative rather than exact project coordinates.

## 6. Enquiry system

**Common fields:** Name (required), company, email (required), phone (required), selected service (required), project location (required), project description (required), anticipated start date, optional attachments and required privacy consent.

**Conditional fields:**
- TMP: RCA, work type, proposed dates, road location.
- QS: Drainage/Roofing/Tanking selection and drawings.
- Events: Event date, venue, approximate attendance, closure requirements.

**Workflow:** Validate and rate-limit on server → apply spam protection → store lead in Supabase → save files in private bucket → notify admin via email → display success/reference number → optionally send acknowledgement email.

**Statuses:** New, Contacted, Quoting, Won, Lost, Closed. Allow filtering, searching, notes, status changes and CSV export in admin. Never expose private attachments through public URLs.

## 7. Admin panel

Protected login via Supabase Auth. Roles: Super Admin and Editor (optional read-only reviewer). Enforce roles server-side and with Supabase RLS.

**P0 launch modules:**
- Dashboard: enquiry counts, recent leads, drafts.
- Page CMS: homepage/about/contact/coverage content; section ordering; draft/preview/publish.
- Service CMS: seven services, scope, steps, FAQs, related services, CTA labels.
- Coverage CMS: region names, descriptions, positions and status.
- Enquiry inbox: search, filter, status, notes, export, protected files.
- Media library: upload, replace, alt text and remove.
- SEO editor: title, description, social preview image.
- Content history/audit log with restore capability.

**P1:** 3D scene preset selection, hotspot labels/destinations, approved camera configurations, analytics and role invitations.

**P2:** Case studies/portfolio module.

Admins can configure **prebuilt** 3D experiences, not model arbitrary new geometry in-browser.

## 8. Technology and architecture

- **Next.js App Router + TypeScript** for website, admin, server-rendered SEO content and route handlers.
- **Node.js** as Next.js server runtime; separate backend unnecessary for v1.
- **Tailwind CSS + shadcn/ui** for UI.
- **Three.js, React Three Fiber and Drei** for 3D rendering and camera controls.
- **GSAP/ScrollTrigger** for animation and scroll-linked storytelling, where appropriate.
- **Blender** for asset production; export optimized glTF/GLB.
- **Supabase Postgres** for CMS, configuration and enquiries.
- **Supabase Auth** for admin login; **Supabase Storage** for public assets and private uploads.
- **Vercel** preferred for Next.js deployment, Netlify acceptable.
- Transactional email provider, error monitoring and analytics configured via environment variables.

**Component boundaries:** `ExperienceCanvas`, `SceneManager`, `CameraController`, `HotspotManager`, `ContentOverlay`, `PerformanceManager`, `CMSRenderer` and standard HTML navigation.

**Deployment environments:** Local, preview/staging and production. Supabase migrations versioned in repository. Do not hardcode credentials.

## 9. Suggested database schema

- `profiles(id, name, role, created_at)`
- `pages(id, slug, title, status, seo_title, seo_description, updated_at)`
- `page_sections(id, page_id, type, content_json, sort_order)`
- `services(id, slug, title, summary, description, cta_label, status)`
- `service_steps(id, service_id, title, description, step_order)`
- `service_relations(service_id, related_service_id)`
- `coverage_regions(id, name, island, latitude, longitude, description, status)`
- `scenes(id, scene_key, model_url, config_json, enabled)`
- `scene_hotspots(id, scene_id, label, position_json, destination)`
- `media_assets(id, storage_path, file_type, alt_text)`
- `enquiries(id, reference, service_id, name, email, phone, company, location, description, status, created_at)`
- `enquiry_files(id, enquiry_id, storage_path, file_name)`
- `content_revisions(id, entity_type, entity_id, content_json, created_by, created_at)`
- `audit_logs(id, actor_id, action, entity_type, entity_id, created_at)`
- `site_settings(key, value_json)`

Use proper foreign keys, indexes, timestamps, input schemas, row-level security and private storage policies. Store extended service-specific enquiry answers in validated structured JSON or dedicated typed columns.

## 10. Performance, accessibility and security

**Targets:** LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile of target users. Aim for 60 FPS on capable desktops and 30 FPS on supported mobiles; adapt rendering to device capacity. Use progressive loading, compressed assets, scene lazy-loading, instancing, texture optimisation and static fallback.

**Accessibility:** WCAG 2.2 AA target, semantic HTML, keyboard navigation, focus indicators, labelled controls, accessible alternatives for hotspots, reduced-motion support and skip animation.

**Security:** HTTPS; RLS; server-side admin checks; secure sessions; private uploads; signed download URLs; input validation; rate limiting; file size/type restrictions; secret management; backups; audit logging. Publish a privacy notice and review NZ Privacy Act 2020 requirements, including data retention.

**SEO:** Indexable SSR service pages, metadata, canonical URLs, sitemap, robots, descriptive content and relevant internal links. Do not put critical page text only in WebGL.

**Analytics:** Track hotspot clicks, service views, CTA clicks, form starts/submissions, coverage interactions and 3D fallback use without recording sensitive enquiry contents.

## 11. Delivery phases

1. **Weeks 1–2 — Design:** Sitemap, brand direction, wireframes, scene storyboard, model inventory, architecture.
2. **Weeks 3–4 — Foundation:** Next.js app, Supabase migrations, auth, CMS, service pages, lead forms.
3. **Weeks 5–7 — 3D:** One world, seven scenes, reusable models, camera travel, hotspots, coverage scene.
4. **Weeks 8–9 — QA:** Performance, mobile fallback, accessibility, security, form flows, admin workflows and SEO.
5. **Week 10 — Launch:** Domain, deployment, monitoring, backups, content verification and admin handover.

These are planning estimates for a small experienced team; custom asset production and solo development can extend the schedule.

## 12. Acceptance criteria

- [ ] Home 3D world loads and supports seven service hotspots.
- [ ] Clicking hotspots animates camera travel and opens correct service information.
- [ ] Standard menu and static/reduced-motion alternatives work.
- [ ] Seven SEO-indexable service pages show scope, process, related services and CTA.
- [ ] Coverage map includes all twelve named areas.
- [ ] Enquiries validate, store securely and appear in admin.
- [ ] Private attachments cannot be accessed anonymously.
- [ ] Admin can edit, preview, publish and restore content.
- [ ] Admin can update region content and approved 3D preset/hotspot settings (P1).
- [ ] Responsive design works on modern desktop and mobile browsers.
- [ ] Production deployment, monitoring and backup plan are verified.

## 13. Out of scope for v1

Full 3D model editor, customer login, payments, automated council/RCA approvals, live NZTA integrations, engineering compliance certification, ERP/project-management suite and AI-generated technical approvals.

## 14. Claude Code implementation instructions

**Claude Code should treat this document as the source of truth.** Build incrementally, maintain a working app, and do not claim that a feature is complete unless implemented and tested.

### Working rules
1. Read this PRD in full and produce an implementation plan and task checklist before editing code.
2. Ask for missing branding assets, company contact details, approved claims and actual project imagery when needed; use clearly marked placeholders otherwise.
3. Prefer a clean, maintainable TypeScript architecture and reusable components.
4. First create a **3D proof of concept** with one world, three clickable hotspots, camera transitions and HTML content overlays. Validate quality before expanding to seven services.
5. Build the website/CMS foundation in parallel or next: database migrations, RLS, auth, public pages and enquiry flow.
6. Populate all seven services using the approved PRD content. Keep service text CMS-editable.
7. Integrate the seven service scenes and coverage map with lazy loading and fallback UI.
8. Implement draft/preview/publish, admin permissions, enquiry status handling and audit logs.
9. Add tests for form validation, authorization, service routes, content publishing and critical user flows.
10. Run lint, type-check, tests and production build; fix failures before considering a milestone complete.
11. Document setup, environment variables, migrations, admin provisioning, asset pipeline, deployment and known limitations in `README.md`.
12. Never expose secrets or use a Supabase service-role key in client code.

### Suggested first prompt to Claude Code

> Read `Urban_Route_NZ_PRD_Claude.md` carefully. You are the lead Next.js architect and 3D web engineer for this project. First inspect the repository and write a phased implementation plan with file structure, database migrations, 3D scene architecture, performance strategy, test plan and outstanding questions. Then scaffold a production-quality Next.js TypeScript application with Tailwind, Supabase integration and a working proof-of-concept 3D homepage containing three interactive service hotspots and smooth camera travel. Keep the normal navigation functional and provide a reduced-motion/static fallback. Do not implement the entire project in one unreviewed step. Report files changed, commands run, tests and next steps.

## 15. Decisions to confirm

- Final logo, brand colours and typography.
- Bright isometric, dark cinematic or hybrid aesthetic (hybrid recommended).
- 3D exploration plus standard navigation (recommended).
- Contact email, phone, enquiry recipient and domain.
- Whether there are approved case studies, testimonials or real site photos.
- Admin roles and publishing approval workflow.
- Exact coverage wording and documented experience claims.
- Budget and production approach for original 3D assets.

---

**End of PRD — Urban Route NZ**
