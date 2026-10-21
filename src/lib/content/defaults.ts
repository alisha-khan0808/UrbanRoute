import type { Page, Region, SceneConfig, Service, SiteSettings } from "./types";

/*
 * Seed content. Service scope and process wording is taken from the PRD.
 * Deliverables and FAQs are drafted placeholders: technical wording and any
 * approval responsibilities must be confirmed by Urban Route NZ before
 * publication (PRD §4).
 */

const seo = (title: string, description: string) => ({ title, description, ogImage: "" });
const steps = (...items: [string, string][]) => items.map(([title, text]) => ({ title, text }));

export const defaultServices: Service[] = [
  {
    slug: "traffic-management-plans",
    number: "01",
    title: "Traffic Management Plans (TMPs)",
    shortTitle: "TMPs",
    summary:
      "TMP and traffic management diagram (TMD) preparation for road-adjacent works, from lane closures to utility trenching.",
    description:
      "We prepare TMPs and TMDs for road-adjacent works such as trenching, drainage, utility works, footpaths, crossings and lane closures. Plans cover cone tapers, signage, temporary speed limits, Stop/Go operations, staging and pedestrian routes, with support through submission and approval.",
    scope: [
      "Trenching, drainage and utility works",
      "Footpath and vehicle crossing works",
      "Lane closures and shoulder works",
      "Cone tapers, signage and temporary speed limits",
      "Stop/Go operations and works staging",
      "Pedestrian and cyclist routes",
      "Submission and approval support",
    ],
    deliverables: [
      "Traffic management plan (TMP)",
      "Traffic management diagrams (TMDs) for each stage",
      "Submission-ready documentation package",
      "Amendments in response to RCA feedback",
    ],
    steps: steps(
      ["Requirements", "We confirm the works, location, programme and constraints."],
      ["Site review", "We review the road environment, access and pedestrian movements."],
      ["TMP/TMD preparation", "We prepare the plan and diagrams for each stage of works."],
      ["Review", "You review the draft and we refine it with your team."],
      ["RCA submission", "We support submission to the road controlling authority."],
      ["Feedback/amendments", "We respond to feedback and amend the documents as needed."],
    ),
    specialisms: [],
    faqs: [
      {
        q: "Which areas do you prepare TMPs for?",
        a: "We work nationwide and have experience with 12+ councils and road controlling authorities across both islands.",
      },
      {
        q: "Can you help when an RCA requests changes?",
        a: "Yes. Feedback and amendments are part of our standard TMP process.",
      },
    ],
    related: ["site-specific-tmps", "on-call-advisory", "project-coordination"],
    ctaLabel: "Request a TMP",
    sceneKey: "roadworks",
    sceneCaption: "Roadworks lane closure with cone taper, signage and live traffic.",
    seo: seo(
      "Traffic Management Plans (TMPs) | Urban Route NZ",
      "TMP and TMD preparation for trenching, drainage, utility works, footpaths, crossings and lane closures across New Zealand.",
    ),
  },
  {
    slug: "site-specific-tmps",
    number: "02",
    title: "Site-Specific TMPs",
    shortTitle: "Site-Specific TMPs",
    summary:
      "Traffic management designed around the real conditions of your site: road width, volumes, intersections and construction method.",
    description:
      "Site-specific TMPs are designed for actual site conditions, accounting for road width, traffic volumes, intersections, driveways, cyclists, public transport, plant movements and the construction method.",
    scope: [
      "Road width and traffic volume constraints",
      "Intersections and driveways",
      "Cyclists and public transport",
      "Plant and construction vehicle movements",
      "Construction method and staging",
    ],
    deliverables: [
      "Site constraints summary",
      "Site-specific traffic management design",
      "Traffic management diagrams (TMDs)",
      "Submission support documentation",
    ],
    steps: steps(
      ["Site information", "We gather drawings, photos, volumes and programme details."],
      ["Constraints", "We identify access, safety and network constraints."],
      ["Site-specific design", "We design the traffic management around your method."],
      ["TMD", "We prepare diagrams for each stage and scenario."],
      ["Review", "We review the design with your team."],
      ["Submission support", "We support you through submission."],
    ),
    specialisms: [],
    faqs: [
      {
        q: "When do I need a site-specific TMP rather than a generic one?",
        a: "Where the site has particular constraints such as busy intersections, driveways, bus routes or complex plant movements. Talk to us and we will advise.",
      },
    ],
    related: ["traffic-management-plans", "on-call-advisory", "traffic-impact-assessments"],
    ctaLabel: "Discuss Your Site",
    sceneKey: "intersection",
    sceneCaption: "Intersection with pedestrians, cyclists, driveways and construction vehicles.",
    seo: seo(
      "Site-Specific TMPs | Urban Route NZ",
      "Site-specific traffic management plans designed around road width, volumes, intersections, driveways, cyclists, public transport and plant movements.",
    ),
  },
  {
    slug: "event-traffic-management",
    number: "03",
    title: "Event Traffic Management",
    shortTitle: "Events",
    summary:
      "Road closures, crowd routes, parking and emergency access planned and coordinated for events of every scale.",
    description:
      "We plan event traffic management including road closures, pedestrian and crowd routes, parking, emergency access and temporary signage, and coordinate with councils and stakeholders.",
    scope: [
      "Road closures and detours",
      "Pedestrian and crowd routes",
      "Parking arrangements",
      "Emergency access routes",
      "Temporary signage",
      "Council and stakeholder coordination",
    ],
    deliverables: [
      "Event traffic management plan",
      "Closure, detour and signage layouts",
      "Stakeholder coordination record",
      "Event-day support as agreed",
    ],
    steps: steps(
      ["Event brief", "We confirm the event, venue, dates and expected attendance."],
      ["Access/traffic assessment", "We assess access, parking and network impacts."],
      ["Event plan", "We prepare the event traffic management plan."],
      ["Stakeholder coordination", "We coordinate with council and stakeholders."],
      ["Readiness", "We confirm readiness ahead of the event."],
      ["Event-day support", "We provide event-day support as agreed."],
    ),
    specialisms: [],
    faqs: [
      {
        q: "How early should we get in touch before our event?",
        a: "As early as possible. Closure approvals and stakeholder coordination take time, so earlier engagement gives more options.",
      },
    ],
    related: ["traffic-management-plans", "project-coordination", "on-call-advisory"],
    ctaLabel: "Discuss Your Event",
    sceneKey: "event",
    sceneCaption: "Market and festival with barriers, crowd movement, parking and emergency routes.",
    seo: seo(
      "Event Traffic Management | Urban Route NZ",
      "Event traffic management: road closures, crowd routes, parking, emergency access, signage and council coordination.",
    ),
  },
  {
    slug: "on-call-advisory",
    number: "04",
    title: "On-Call Advisory",
    shortTitle: "On-Call Advisory",
    summary:
      "Practical technical advice when site conditions, methods or RCA feedback change.",
    description:
      "Practical technical advice on changing site conditions, methods, RCA feedback, TMD amendments, schedules and compliance queries, so your works keep moving.",
    scope: [
      "Changing site conditions",
      "Construction method changes",
      "RCA feedback and queries",
      "TMD amendments",
      "Schedule changes",
      "Compliance queries",
    ],
    deliverables: [
      "Technical advice and recommendations",
      "Revised TMDs where needed",
      "Coordinated next steps",
    ],
    steps: steps(
      ["Raise issue", "Tell us what has changed on site or in feedback."],
      ["Review constraints", "We review the constraints and options."],
      ["Recommend solution", "We recommend a practical way forward."],
      ["Revise documents if needed", "We update TMDs or plans where required."],
      ["Coordinate next steps", "We coordinate the next steps with your team."],
    ),
    specialisms: [],
    faqs: [],
    related: ["traffic-management-plans", "site-specific-tmps", "project-coordination"],
    ctaLabel: "Request Technical Advice",
    sceneKey: "advisory",
    sceneCaption: "Construction site with revised traffic plan overlays.",
    seo: seo(
      "On-Call Traffic Management Advisory | Urban Route NZ",
      "On-call technical advice for changing site conditions, methods, RCA feedback, TMD amendments, schedules and compliance queries.",
    ),
  },
  {
    slug: "quantity-surveying",
    number: "05",
    title: "Quantity Surveying (QS)",
    shortTitle: "Quantity Surveying",
    summary:
      "Quantity take-offs, BOQs and cost build-ups for drainage, roofing and tanking & waterproofing work.",
    description:
      "We provide quantity take-offs, bills of quantities (BOQs), materials, labour and plant assessments, cost build-ups and support for tenders and quotations.",
    scope: [
      "Quantity take-offs",
      "Bills of quantities (BOQs)",
      "Materials, labour and plant",
      "Cost build-ups",
      "Tenders and quotations",
    ],
    deliverables: ["Quantity take-off schedule", "Bill of quantities (BOQ)", "Cost build-up", "Quotation support"],
    steps: steps(
      ["Drawings", "Send us your drawings and specifications."],
      ["Take-off", "We measure quantities from the drawings."],
      ["BOQ", "We prepare the bill of quantities."],
      ["Cost build-up", "We build up costs for materials, labour and plant."],
      ["Quotation", "We support your tender or quotation."],
    ),
    specialisms: [
      { title: "Drainage QS", text: "Pipes, manholes, excavation, bedding, backfill and reinstatement." },
      { title: "Roofing QS", text: "Roof areas, membranes, flashings, gutters and downpipes." },
      {
        title: "Tanking & Waterproofing QS",
        text: "Below-ground membranes, retaining walls and foundations.",
      },
    ],
    faqs: [
      {
        q: "What file formats can I send?",
        a: "PDF drawings are ideal. You can attach them to your enquiry and we will confirm anything else we need.",
      },
    ],
    related: ["project-coordination", "site-specific-tmps"],
    ctaLabel: "Request a QS Quote",
    sceneKey: "qs",
    sceneCaption: "Building cutaway with selectable drainage, roofing and waterproofing layers.",
    seo: seo(
      "Quantity Surveying — Drainage, Roofing, Tanking | Urban Route NZ",
      "Quantity take-offs, BOQs, cost build-ups and quotations for drainage, roofing and tanking & waterproofing.",
    ),
  },
  {
    slug: "project-coordination",
    number: "06",
    title: "Project Coordination",
    shortTitle: "Project Coordination",
    summary:
      "One point of coordination across clients, designers, contractors, traffic management, QS and council approvals.",
    description:
      "We coordinate the client, designers, contractors, traffic management, QS, council approvals, programme, site teams and documentation from scope through to handover.",
    scope: [
      "Client and designer coordination",
      "Contractor and site team coordination",
      "Traffic management and QS integration",
      "Council approvals",
      "Programme management",
      "Documentation control",
    ],
    deliverables: ["Coordinated programme", "Approvals tracker", "Change register", "Handover documentation"],
    steps: steps(
      ["Scope", "We define the project scope and stakeholders."],
      ["Planning", "We plan the programme and dependencies."],
      ["Approvals", "We coordinate council and RCA approvals."],
      ["Readiness", "We confirm site readiness."],
      ["Traffic management", "We integrate traffic management."],
      ["Site delivery", "We coordinate teams through delivery."],
      ["Changes", "We manage and record changes."],
      ["Completion", "We coordinate completion activities."],
      ["Handover", "We compile documentation for handover."],
    ),
    specialisms: [],
    faqs: [],
    related: ["traffic-management-plans", "quantity-surveying", "on-call-advisory"],
    ctaLabel: "Discuss Your Project",
    sceneKey: "coordination",
    sceneCaption: "Construction site progressing through project stages.",
    seo: seo(
      "Project Coordination | Urban Route NZ",
      "Project coordination across clients, designers, contractors, traffic management, QS, council approvals, programme and site teams.",
    ),
  },
  {
    slug: "traffic-impact-assessments",
    number: "07",
    title: "Traffic Impact Assessments (TIA)",
    shortTitle: "TIA",
    summary:
      "Assessing access, traffic generation, intersections and parking for proposed developments.",
    description:
      "We assess site access, traffic generation, intersections, parking, pedestrians, servicing and loading, and access safety for proposed developments.",
    scope: [
      "Site access",
      "Traffic generation",
      "Intersection performance",
      "Parking",
      "Pedestrians",
      "Servicing and loading",
      "Access safety",
    ],
    deliverables: ["Existing conditions summary", "Traffic impact analysis", "Recommendations", "TIA report"],
    steps: steps(
      ["Development brief", "We confirm the proposed development and its context."],
      ["Existing conditions", "We review the existing network and access."],
      ["Traffic assessment", "We assess generation, parking and movements."],
      ["Impact analysis", "We analyse impacts on intersections and safety."],
      ["Recommendations", "We recommend mitigation and design changes."],
      ["TIA report", "We deliver the traffic impact assessment report."],
    ),
    specialisms: [],
    faqs: [],
    related: ["site-specific-tmps", "project-coordination"],
    ctaLabel: "Request a Traffic Assessment",
    sceneKey: "tia",
    sceneCaption: "Development and intersection with vehicle-flow overlays.",
    seo: seo(
      "Traffic Impact Assessments (TIA) | Urban Route NZ",
      "Traffic impact assessments covering access, traffic generation, intersections, parking, pedestrians, servicing and safety.",
    ),
  },
];

const region = (
  id: string,
  name: string,
  island: "north" | "south",
  latitude: number,
  longitude: number,
): Region => ({
  id,
  name,
  island,
  latitude,
  longitude,
  status: "experience",
  description: `Urban Route NZ has documented prior experience working within the ${name} area. [Placeholder — replace with approved wording.]`,
});

/** Marker positions are representative, not exact project coordinates (PRD §5). */
export const defaultRegions: Region[] = [
  region("auckland", "Auckland", "north", -36.85, 174.76),
  region("hamilton-waikato", "Hamilton / Waikato", "north", -37.6, 175.15),
  region("waipa", "Waipā", "north", -38.0, 175.33),
  region("matamata-piako", "Matamata-Piako", "north", -37.72, 175.75),
  region("waitomo", "Waitomo", "north", -38.33, 175.0),
  region("taupo", "Taupō", "north", -38.69, 176.07),
  region("ruapehu", "Ruapehu", "north", -39.1, 175.4),
  region("christchurch", "Christchurch", "south", -43.53, 172.63),
  region("buller", "Buller", "south", -41.75, 171.7),
  region("west-coast", "West Coast", "south", -42.3, 171.4),
  region("westland", "Westland", "south", -42.9, 170.85),
  region("invercargill", "Invercargill", "south", -46.41, 168.35),
];

export const defaultPages: Page[] = [
  {
    slug: "home",
    title: "Home",
    seo: seo(
      "Urban Route NZ — Traffic Management, QS & Project Coordination",
      "Traffic management planning, quantity surveying, project coordination and traffic impact assessments for contractors, utilities, councils and events across NZ.",
    ),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Nationwide · North & South Islands",
        heading: "Planning the routes that keep New Zealand moving.",
        body: "Temporary traffic management planning, quantity surveying, project coordination and traffic impact assessments for civil contractors, utilities, councils and event organisers.",
        items: [],
        ctaLabel: "Start an enquiry",
        ctaHref: "/contact",
      },
      {
        id: "stats",
        type: "stats",
        eyebrow: "",
        heading: "Experience across the network",
        body: "",
        items: [
          { title: "12+", text: "Councils and road controlling authorities" },
          { title: "2", text: "Islands — North and South" },
          { title: "7", text: "Integrated services" },
        ],
        ctaLabel: "",
        ctaHref: "",
      },
      {
        id: "audiences",
        type: "features",
        eyebrow: "Who we work with",
        heading: "Built for the people who build, maintain and use our roads",
        body: "",
        items: [
          { title: "Civil contractors", text: "TMPs, site-specific designs and on-call advice that keep crews productive." },
          { title: "Utility companies", text: "Planning for trenching, drainage and service connections in live road corridors." },
          { title: "Councils & RCAs", text: "Clear, well-prepared documentation for review and approval." },
          { title: "Event organisers", text: "Closures, crowd routes, parking and emergency access, coordinated." },
          { title: "Developers & construction", text: "Traffic impact assessments, QS and project coordination." },
        ],
        ctaLabel: "",
        ctaHref: "",
      },
      {
        id: "cta",
        type: "cta",
        eyebrow: "",
        heading: "Have a project coming up?",
        body: "Tell us about the works, the location and your timeframe. Attach drawings if you have them.",
        items: [],
        ctaLabel: "Start an enquiry",
        ctaHref: "/contact",
      },
    ],
  },
  {
    slug: "about",
    title: "About",
    seo: seo(
      "About Urban Route NZ",
      "Urban Route NZ is a New Zealand consultancy providing traffic management planning, quantity surveying, project coordination and traffic impact assessments.",
    ),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "About Urban Route NZ",
        heading: "An engineering-led consultancy for New Zealand's road corridors.",
        body: "Urban Route NZ serves civil contractors, utilities, councils and event organisers nationwide, providing temporary traffic management planning, quantity surveying, project coordination and traffic impact assessments.",
        items: [],
        ctaLabel: "",
        ctaHref: "",
      },
      {
        id: "experience",
        type: "text",
        eyebrow: "Experience",
        heading: "12+ councils and road controlling authorities",
        body: "We have worked across 12+ councils and road controlling authorities in the North and South Islands and with NZTA Waka Kotahi. [Placeholder — replace with approved experience wording. This does not imply endorsement by any council or NZTA.]",
        items: [],
        ctaLabel: "View coverage",
        ctaHref: "/coverage",
      },
      {
        id: "approach",
        type: "features",
        eyebrow: "How we work",
        heading: "Practical, documented, coordinated",
        body: "",
        items: [
          { title: "Site-first", text: "Plans that reflect real site conditions and construction methods." },
          { title: "Clear documentation", text: "Submission-ready plans, diagrams and reports." },
          { title: "Responsive", text: "On-call advice when conditions or feedback change." },
        ],
        ctaLabel: "",
        ctaHref: "",
      },
      {
        id: "cta",
        type: "cta",
        eyebrow: "",
        heading: "Let's talk about your next project",
        body: "",
        items: [],
        ctaLabel: "Contact us",
        ctaHref: "/contact",
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    seo: seo(
      "Contact Urban Route NZ — Project Enquiries",
      "Send a project enquiry for TMPs, event traffic management, quantity surveying, project coordination or traffic impact assessments.",
    ),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Enquiries",
        heading: "Tell us about your project",
        body: "Share the works, location and timeframe. Attach drawings or plans if you have them and we will be in touch.",
        items: [],
        ctaLabel: "",
        ctaHref: "",
      },
    ],
  },
  {
    slug: "coverage",
    title: "Coverage",
    seo: seo(
      "Coverage — Urban Route NZ",
      "Urban Route NZ provides services nationwide, with documented experience across councils in the North and South Islands.",
    ),
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Coverage",
        heading: "Nationwide service. Local experience.",
        body: "We provide services across New Zealand. Highlighted areas show where we have documented prior experience. Markers are representative and do not imply endorsement by any council, RCA or NZTA.",
        items: [],
        ctaLabel: "",
        ctaHref: "",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy notice",
    seo: seo("Privacy Notice | Urban Route NZ", "How Urban Route NZ collects, uses and protects personal information."),
    sections: [
      {
        id: "intro",
        type: "text",
        eyebrow: "Privacy notice",
        heading: "How we handle your information",
        body: "[Placeholder privacy notice — must be reviewed against the NZ Privacy Act 2020 before launch.]\n\nWhen you send an enquiry we collect your name, company, email, phone number, project details and any files you attach. We use this information only to respond to your enquiry and to provide our services.\n\nEnquiry files are stored in private storage and are only accessible to authorised Urban Route NZ staff. We do not sell your information.\n\nWe keep enquiry records for as long as needed to respond and for our business records, then delete them in line with our retention policy.\n\nYou can ask to access or correct your personal information at any time by contacting us. You can also contact the Office of the Privacy Commissioner if you have concerns.",
        items: [],
        ctaLabel: "",
        ctaHref: "",
      },
      {
        id: "analytics",
        type: "text",
        eyebrow: "",
        heading: "Analytics",
        body: "We measure anonymous usage of this website, such as which services are viewed and how the 3D explorer is used. We never record the contents of your enquiry in analytics.",
        items: [],
        ctaLabel: "",
        ctaHref: "",
      },
    ],
  },
];

export const defaultScene: SceneConfig = {
  key: "home-world",
  enabled: true,
  modelUrl: "",
  defaultQuality: "auto",
  introAnimation: true,
  hotspots: defaultServices.map((s) => ({
    id: s.sceneKey,
    label: s.shortTitle,
    destination: s.slug,
    cameraPreset: "standard" as const,
    enabled: true,
  })),
};

export const defaultSettings: SiteSettings = {
  companyName: "Urban Route NZ",
  tagline: "Traffic management planning, QS and project coordination — nationwide.",
  email: "hello@urbanroute.example",
  phone: "+64 0 000 0000",
  serviceArea: "Nationwide — North and South Islands",
  placeholderNotice: true,
};
