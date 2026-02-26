# CA Data Centers — Embodied Carbon Compliance Map

An interactive map of California data centers showing which facilities fall under CCA (Community Choice Aggregation) jurisdictions where **CALGreen Title 24 Part 11 §5.409 embodied carbon regulations apply**, with EPD data from the EC3 Building Transparency database.

---

## What This Tool Does

- **Heatmap** of existing CA data center density pulled live from OpenStreetMap
- **12 pipeline projects** — permitted, approved, or in planning — shown as pulsing orange markers with real project data (MW, sqft, permit dates, sources)
- **6 CCA jurisdiction overlays** — BAAQMD, SCAQMD, SMAQMD, SDAPCD, SJVAPCD, VCAPCD
- **Layer toggles** — show/hide existing vs pipeline independently
- **Per-facility compliance panel** — click any marker to see which regulations apply
- **EPD data** from EC3 (Building Transparency) for 5 regulated material categories: Ready-Mix Concrete, Structural Steel, Rebar, CMU Block, Steel Decking
- GWP values, compliance status, and % reduction vs CA baseline per product

---

## Applicable California Regulations

### In Force Now

**CALGreen Title 24 Part 11 Section 5.409** — the primary enforceable law for private data centers:
- Effective July 1, 2024 for new nonresidential construction over 100,000 sqft
- Effective January 1, 2026 threshold drops to 50,000 sqft
- Requires either: (1) whole-building lifecycle assessment showing 10% below baseline, or (2) prescriptive path with EPD documentation for steel, glass, mineral wool, and concrete below specified GWP thresholds
- Applies statewide to all pipeline data center projects at permit submission
- Does NOT retroactively apply to existing facilities unless major renovation over 100k sqft

**AB 262 — Buy Clean California Act** (in force since 2019):
- Requires EPD submission and GWP limits for structural steel, rebar, flat glass, and mineral wool
- Applies only to state-funded projects

### Pending / Not Yet Enforceable

**AB 2446** (signed 2022) — directs CARB to develop a framework for measuring and reducing embodied carbon in building materials by 40% by 2035. Rules not yet finalized.

**AB 43** (signed 2023) — enables an optional embodied carbon trading system, implementable from January 1, 2029.

Note: There is no California Senate Bill (SB) equivalent in the embodied carbon space. All CA embodied carbon legislation has come through Assembly Bills.

---

## Pipeline Projects Included

| Project | Operator | MW | Status |
|---|---|---|---|
| Amazon East Gilroy Campus | AWS | 200 | Approved |
| GI Partners Bowers DC | GI Partners | 72 | Approved |
| Terra Ventures / Arcadis Sustainable DC | Terra Ventures | 60 | Application Filed |
| Imperial Valley Hyperscale Campus | Imperial Valley DCs | 330 | Grading Permit Issued |
| Goodman Group Silicon Valley DC | Goodman Group | 120 | Land Acquired |
| Prime Data Centers Sacramento Bldg 2 | Prime Data Centers | 32 | Pre-Application Filed |
| HMC Capital DigiCo LAX1 | HMC Capital / DigiCo | 56 | Planned |
| CyrusOne / Ameresco NorCal Campus | CyrusOne | 100 | Planned |
| Vernon Industrial DC Campus | Undisclosed | 80 | Planned |
| PG&E Cluster Study Sunnyvale | Undisclosed Hyperscaler | 75 | PG&E Interconnection Queue |
| PG&E Cluster Study East Bay | Undisclosed Hyperscaler | 60 | PG&E Interconnection Queue |
| Rowan Digital Infrastructure NorCal | Rowan | 90 | Planned |

---

## Tech Stack

- Next.js 16 — React framework
- Mapbox GL JS — 3D map, heatmap, custom layers
- OpenStreetMap Overpass API — live data center location data
- EC3 / Building Transparency API — EPD data (falls back to curated demo data without API key)
- Vercel — hosting and deployment
- TypeScript + Tailwind CSS

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/dexdogs/ca-data-centers-3d.git
cd ca-data-centers-3d
npm install
```

### 2. Configure environment
```bash
cp env.local.example .env.local
```

Edit .env.local and add your Mapbox token from account.mapbox.com. The EC3 API token is optional — without it the app uses demo EPD data.

### 3. Run locally
```bash
npm run dev
```

---

## Deploy to Vercel

1. Go to vercel.com, add new project, import this repo
2. Set Framework Preset to Next.js
3. Add environment variable NEXT_PUBLIC_MAPBOX_TOKEN
4. Click Deploy

Every git push to main auto-redeploys.

---

## Data Sources

- Existing data center locations: OpenStreetMap via Overpass API plus curated known facilities
- Pipeline projects: Data Center Dynamics, Data Center Knowledge, BlackRidge Research, local planning filings, PG&E interconnection queue
- CCA jurisdiction boundaries: CARB/AQMD published district boundaries
- EPD data: EC3 openEPD API / Building Transparency

EPD data powered by EC3 / Building Transparency. Per their terms, all third-party use should acknowledge Building Transparency and EC3.
