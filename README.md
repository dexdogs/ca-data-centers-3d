# CA Data Centers — Embodied Carbon Compliance Map

An interactive 3D map of California data centers showing which facilities fall under CCA (Community Choice Aggregation) jurisdictions where **AB 2446 / CALGreen embodied carbon regulations apply**, with live EPD data from the EC3 Building Transparency database.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Mapbox](https://img.shields.io/badge/Mapbox-GL%20JS-blue) ![EC3](https://img.shields.io/badge/EC3-openEPD%20API-green)

---

## Features

- **Heatmap** of CA data center density using OpenStreetMap Overpass API
- **CCA Jurisdiction overlays** — BAAQMD, SCAQMD, SMAQMD, SDAPCD, SJVAPCD, VCAPCD
- **Per-facility compliance panel** showing whether AB 2446 applies
- **Live EPD data** from EC3 (Building Transparency) for key regulated materials:
  - Ready-Mix Concrete
  - Structural Steel
  - Concrete Rebar
  - CMU Block
  - Steel Decking
- GWP values, compliance status, and % reduction vs. CA baseline
- Falls back to curated demo EPD data if no EC3 API key is set

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/dexdogs/ca-data-centers-3d.git
cd ca-data-centers-3d
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | [account.mapbox.com](https://account.mapbox.com) → Tokens |
| `EC3_API_TOKEN` | [buildingtransparency.org](https://buildingtransparency.org/ec3/manage-apps/keys) → API Keys |

> **Note:** The app works without `EC3_API_TOKEN` — it will display curated mock EPD data for demo purposes.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**:
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `EC3_API_TOKEN` (optional)

---

## Architecture

```
app/
  page.tsx                  # Main Mapbox map + heatmap + CCA overlays
  layout.tsx                # Root layout
  globals.css               # Design system (Space Mono + Sora fonts)
  api/
    datacenters/route.ts    # Fetches CA data centers from OSM Overpass API
    epds/route.ts           # Proxies EC3 openEPD API (with mock fallback)
  components/
    EPDPanel.tsx            # Right panel: facility detail + EPD cards
    CCALegend.tsx           # Left panel: map legend + stats
lib/
  cca.ts                    # CCA jurisdiction data + geo-lookup utility
types/
  index.ts                  # Shared TypeScript interfaces
```

---

## CCA Jurisdictions Covered

| District | Shortname | Regulation Year |
|---|---|---|
| Bay Area Air Quality Management District | BAAQMD | 2024 |
| South Coast Air Quality Management District | SCAQMD | 2024 |
| Sacramento Metropolitan AQMD | SMAQMD | 2025 |
| San Diego Air Pollution Control District | SDAPCD | 2024 |
| San Joaquin Valley APCD | SJVAPCD | 2025 |
| Ventura County APCD | VCAPCD | 2025 |

---

## Regulation Context

**AB 2446** (signed 2022) requires CARB to develop a framework for measuring and reducing embodied carbon in construction materials by 40% by 2035. **CALGreen 2024** mandates whole-building LCAs for large commercial projects.

Data centers are subject to these requirements when constructing new facilities over 10,000 sqft within covered jurisdictions.

---

## EPD Attribution

EPD data is powered by **[EC3 / Building Transparency](https://buildingtransparency.org)**. Per their terms of use, all third-party use of EC3 data should acknowledge Building Transparency and EC3.

---

## Data Sources

- **Data center locations**: [OpenStreetMap](https://openstreetmap.org) via Overpass API, supplemented with known major CA facilities
- **CCA jurisdictions**: Based on CARB/AQMD published boundaries
- **EPD data**: [EC3 openEPD API](https://openepd.buildingtransparency.org/api)
