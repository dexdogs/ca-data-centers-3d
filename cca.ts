import { CCAJurisdiction, DataCenter } from '@/types';

// California CCA (Community Choice Aggregation) jurisdictions where
// CALGreen Title 24 Part 11 §5.409 embodied carbon requirements are actively enforced.
// As of July 1, 2024: mandatory for new nonresidential construction >100,000 sqft.
// As of January 1, 2026: threshold drops to >50,000 sqft.
// All 12 pipeline data centers in this tool exceed 100k sqft and are subject at permit submission.
// Existing data centers are NOT retroactively affected unless undergoing major renovation >100k sqft.
export const CCA_JURISDICTIONS: CCAJurisdiction[] = [
  {
    id: 'bay-area',
    name: 'Bay Area Air Quality Management District',
    shortName: 'BAAQMD',
    color: '#00d4ff',
    description: 'CALGreen §5.409 enforced at building permit. BAAQMD also requires air quality review for backup generators (Rule 2-1). Projects >100k sqft must submit a whole-building LCA or qualifying EPDs.',
    regulationYear: 2024,
    bounds: [-123.0, 37.0, -121.2, 38.3],
  },
  {
    id: 'scaqmd',
    name: 'South Coast Air Quality Management District',
    shortName: 'SCAQMD',
    color: '#ff6b35',
    description: 'CALGreen §5.409 enforced at building permit. SCAQMD Rule 403 and Rule 445 add local air quality requirements. LA County also layers additional sustainability requirements for large commercial.',
    regulationYear: 2024,
    bounds: [-118.95, 33.4, -116.9, 34.85],
  },
  {
    id: 'sacramento',
    name: 'Sacramento Metropolitan Air Quality Management District',
    shortName: 'SMAQMD',
    color: '#a8ff3e',
    description: 'CALGreen §5.409 enforced at building permit. Sacramento County early adopter of Title 24 Part 11. State-funded data center projects also subject to AB 262 Buy Clean California Act.',
    regulationYear: 2024,
    bounds: [-121.85, 38.25, -120.8, 38.85],
  },
  {
    id: 'san-diego',
    name: 'San Diego Air Pollution Control District',
    shortName: 'SDAPCD',
    color: '#ff3eac',
    description: 'CALGreen §5.409 enforced at building permit. San Diego County has additional Climate Action Plan requirements for large commercial development. Whole-building LCA recommended even below threshold.',
    regulationYear: 2024,
    bounds: [-117.6, 32.5, -116.1, 33.5],
  },
  {
    id: 'central-valley',
    name: 'San Joaquin Valley Air Pollution Control District',
    shortName: 'SJVAPCD',
    color: '#ffcc00',
    description: 'CALGreen §5.409 enforced at building permit. SJVAPCD has among the strictest backup generator permitting in CA — Rule 4702 limits NOx from diesel generators, pushing data centers toward cleaner backup.',
    regulationYear: 2024,
    bounds: [-121.0, 35.5, -118.5, 37.8],
  },
  {
    id: 'ventura',
    name: 'Ventura County Air Pollution Control District',
    shortName: 'VCAPCD',
    color: '#b347ff',
    description: 'CALGreen §5.409 enforced at building permit. Ventura County aligns with SCAQMD requirements. Rule 74.20 restricts diesel generator emissions, relevant to data center backup power systems.',
    regulationYear: 2024,
    bounds: [-119.4, 33.9, -118.5, 34.5],
  },
];

export function getJurisdictionForLocation(lat: number, lng: number): CCAJurisdiction | undefined {
  return CCA_JURISDICTIONS.find(({ bounds: [west, south, east, north] }) =>
    lng >= west && lng <= east && lat >= south && lat <= north
  );
}

export function enrichWithCCA(dataCenters: Omit<DataCenter, 'inCCAJurisdiction' | 'ccaJurisdiction'>[]): DataCenter[] {
  return dataCenters.map(dc => {
    const jurisdiction = getJurisdictionForLocation(dc.lat, dc.lng);
    return { ...dc, inCCAJurisdiction: !!jurisdiction, ccaJurisdiction: jurisdiction };
  });
}
