import { NextRequest, NextResponse } from 'next/server';

// EC3 / openEPD API - materials relevant to data center construction under AB 2446
// Key materials regulated: concrete, structural steel, rebar, CMU, aluminum, glass
const REGULATED_CATEGORIES = [
  { id: 'ReadyMix', label: 'Ready-Mix Concrete', unit: 'm³', baseline: 350 },
  { id: 'SteelSection', label: 'Structural Steel', unit: 'kg', baseline: 1.5 },
  { id: 'RebarAndRod', label: 'Concrete Reinforcing Bar', unit: 'kg', baseline: 1.2 },
  { id: 'CMU', label: 'Concrete Masonry Unit', unit: 'kg', baseline: 0.12 },
  { id: 'SteelDeck', label: 'Steel Decking', unit: 'kg', baseline: 1.8 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'ReadyMix';
  const jurisdiction = searchParams.get('jurisdiction') || '';

  const apiToken = process.env.EC3_API_TOKEN;

  if (!apiToken) {
    // Return mock EPD data for demo when no API key is present
    return NextResponse.json(getMockEPDs(category, jurisdiction));
  }

  try {
    // EC3 openEPD API endpoint
    const omfQuery = `!EC3 search("${category}") jurisdiction:"US-CA" !pragma oMF("1.0/1")`;

    const response = await fetch(
      `https://openepd.buildingtransparency.org/api/v3/epds?omf=${encodeURIComponent(omfQuery)}&page_size=10`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 86400 }, // Cache 24h
      }
    );

    if (!response.ok) {
      throw new Error(`EC3 API error: ${response.status}`);
    }

    const data = await response.json();
    const catInfo = REGULATED_CATEGORIES.find(c => c.id === category);

    const epds = (data.epds || []).slice(0, 8).map((epd: Record<string, unknown>) => {
      const gwp = (epd.gwp as Record<string, number>)?.mean ?? 0;
      const baseline = catInfo?.baseline ?? 1;
      const reduction = baseline > 0 ? Math.round(((baseline - gwp) / baseline) * 100) : 0;
      return {
        id: epd.id,
        name: epd.product_name || epd.name,
        manufacturer: (epd.manufacturer as Record<string, string>)?.name,
        category: catInfo?.label || category,
        gwp,
        declaredUnit: catInfo?.unit || 'unit',
        validUntil: epd.valid_until,
        ec3Url: `https://buildingtransparency.org/epds/${epd.id}`,
        complianceStatus: gwp < baseline * 0.8 ? 'compliant' : gwp < baseline ? 'at-risk' : 'unknown',
        gwpBaseline: baseline,
        gwpReduction: reduction,
      };
    });

    return NextResponse.json({ epds, category: catInfo?.label || category, source: 'ec3' });
  } catch (err) {
    console.error('EC3 API error:', err);
    return NextResponse.json(getMockEPDs(category, jurisdiction));
  }
}

function getMockEPDs(category: string, _jurisdiction: string) {
  const catInfo = REGULATED_CATEGORIES.find(c => c.id === category) ?? REGULATED_CATEGORIES[0];

  const mockData: Record<string, Array<{name: string; manufacturer: string; gwp: number}>> = {
    ReadyMix: [
      { name: 'GreenMix 4000 Low Carbon', manufacturer: 'CalPortland', gwp: 210 },
      { name: 'EcoStruct Ready Mix', manufacturer: 'Lehigh Hanson', gwp: 265 },
      { name: 'Standard Ready Mix 5000 PSI', manufacturer: 'Vulcan Materials', gwp: 310 },
      { name: 'Ultra Low Carbon Mix', manufacturer: 'Martin Marietta', gwp: 175 },
      { name: 'Type IL Ready Mix', manufacturer: 'CEMEX', gwp: 290 },
    ],
    SteelSection: [
      { name: 'EAF Wide Flange W14', manufacturer: 'Nucor', gwp: 0.89 },
      { name: 'BF Wide Flange W14', manufacturer: 'US Steel', gwp: 1.67 },
      { name: 'Recycled Content W Shapes', manufacturer: 'Commercial Metals', gwp: 0.94 },
    ],
    RebarAndRod: [
      { name: '#5 Rebar 100% Recycled', manufacturer: 'Nucor', gwp: 0.72 },
      { name: '#5 Rebar Standard', manufacturer: 'Gerdau', gwp: 1.1 },
      { name: '#8 Rebar EAF', manufacturer: 'Commercial Metals', gwp: 0.85 },
    ],
    CMU: [
      { name: 'Lightweight CMU', manufacturer: 'Basalite', gwp: 0.08 },
      { name: 'Standard 8" CMU', manufacturer: 'Oldcastle APG', gwp: 0.11 },
      { name: 'Hi-Strength CMU', manufacturer: 'Pacific Block', gwp: 0.13 },
    ],
    SteelDeck: [
      { name: '3" Type B Steel Deck', manufacturer: 'Verco', gwp: 1.24 },
      { name: '2" Form Deck', manufacturer: 'New Millennium', gwp: 1.52 },
      { name: 'Composite Deck W3', manufacturer: 'Vulcraft', gwp: 1.38 },
    ],
  };

  const items = mockData[category] ?? mockData['ReadyMix'];
  const baseline = catInfo.baseline;

  const epds = items.map((item, i) => {
    const reduction = Math.round(((baseline - item.gwp) / baseline) * 100);
    return {
      id: `mock-${category}-${i}`,
      name: item.name,
      manufacturer: item.manufacturer,
      category: catInfo.label,
      gwp: item.gwp,
      declaredUnit: catInfo.unit,
      validUntil: '2027-01-01',
      ec3Url: `https://buildingtransparency.org/ec3`,
      complianceStatus: item.gwp < baseline * 0.8 ? 'compliant' : item.gwp < baseline ? 'at-risk' : 'unknown' as const,
      gwpBaseline: baseline,
      gwpReduction: reduction,
    };
  });

  return { epds, category: catInfo.label, source: 'mock', categories: REGULATED_CATEGORIES };
}
