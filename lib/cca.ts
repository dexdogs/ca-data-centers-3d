import { CCAJurisdiction, DataCenter } from '@/types';

// California CCA (Community Choice Aggregation) jurisdictions with embodied carbon relevance
// These are areas where AB 2446 / CALGreen embodied carbon rules are most actively enforced
// and where local jurisdictions have additional requirements beyond state minimums.
export const CCA_JURISDICTIONS: CCAJurisdiction[] = [
  {
    id: 'bay-area',
    name: 'Bay Area Air Quality Management District',
    shortName: 'BAAQMD',
    color: '#00d4ff',
    description: 'Active CALGreen EC enforcement. Requires whole-building LCA for projects >100k sqft.',
    regulationYear: 2024,
    bounds: [-123.0, 37.0, -121.2, 38.3],
  },
  {
    id: 'scaqmd',
    name: 'South Coast Air Quality Management District',
    shortName: 'SCAQMD',
    color: '#ff6b35',
    description: 'LA Basin region. Enhanced embodied carbon disclosure requirements.',
    regulationYear: 2024,
    bounds: [-118.95, 33.4, -116.9, 34.85],
  },
  {
    id: 'sacramento',
    name: 'Sacramento Metropolitan Air Quality Management District',
    shortName: 'SMAQMD',
    color: '#a8ff3e',
    description: 'State capital region. Early adopter of CARB AB 2446 framework.',
    regulationYear: 2025,
    bounds: [-121.85, 38.25, -120.8, 38.85],
  },
  {
    id: 'san-diego',
    name: 'San Diego Air Pollution Control District',
    shortName: 'SDAPCD',
    color: '#ff3eac',
    description: 'San Diego County. Mandatory EPD submission for large commercial builds.',
    regulationYear: 2024,
    bounds: [-117.6, 32.5, -116.1, 33.5],
  },
  {
    id: 'central-valley',
    name: 'San Joaquin Valley Air Pollution Control District',
    shortName: 'SJVAPCD',
    color: '#ffcc00',
    description: 'Central Valley region. Focus on concrete and steel emissions reduction.',
    regulationYear: 2025,
    bounds: [-121.0, 35.5, -118.5, 37.8],
  },
  {
    id: 'ventura',
    name: 'Ventura County Air Pollution Control District',
    shortName: 'VCAPCD',
    color: '#b347ff',
    description: 'Ventura County. Aligned with SCAQMD requirements.',
    regulationYear: 2025,
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
    return {
      ...dc,
      inCCAJurisdiction: !!jurisdiction,
      ccaJurisdiction: jurisdiction,
    };
  });
}
