import { NextResponse } from 'next/server';
import { OverpassElement } from '@/types';
import { enrichWithCCA } from '@/lib/cca';

// Overpass QL query to find data centers in California
const OVERPASS_QUERY = `
[out:json][timeout:30];
(
  node["building"="data_center"](32.5,-124.5,42.0,-114.1);
  way["building"="data_center"](32.5,-124.5,42.0,-114.1);
  node["telecom"="data_center"](32.5,-124.5,42.0,-114.1);
  way["telecom"="data_center"](32.5,-124.5,42.0,-114.1);
  node["office"="data_center"](32.5,-124.5,42.0,-114.1);
  way["office"="data_center"](32.5,-124.5,42.0,-114.1);
  node["man_made"="data_center"](32.5,-124.5,42.0,-114.1);
  way["man_made"="data_center"](32.5,-124.5,42.0,-114.1);
);
out center;
`;

export async function GET() {
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements: OverpassElement[] = data.elements ?? [];

    // Normalize nodes and ways into a unified format
    const rawDCs = elements
      .map((el) => {
        const lat = el.type === 'node' ? el.lat : el.center?.lat;
        const lng = el.type === 'node' ? el.lon : el.center?.lon;
        if (!lat || !lng) return null;

        const name =
          el.tags?.name ||
          el.tags?.['name:en'] ||
          el.tags?.operator ||
          `Data Center (OSM ${el.id})`;

        return {
          id: `osm-${el.id}`,
          name,
          lat,
          lng,
          operator: el.tags?.operator,
          address: el.tags?.['addr:city']
            ? `${el.tags['addr:city']}, CA`
            : undefined,
        };
      })
      .filter(Boolean) as Omit<Parameters<typeof enrichWithCCA>[0][0], 'inCCAJurisdiction' | 'ccaJurisdiction'>[];

    // Supplement with known major CA data centers not always in OSM
    const knownDCs = [
      { id: 'known-1', name: 'Equinix SV1 – San Jose', lat: 37.338, lng: -121.886, operator: 'Equinix' },
      { id: 'known-2', name: 'Equinix LA1 – El Segundo', lat: 33.919, lng: -118.403, operator: 'Equinix' },
      { id: 'known-3', name: 'Digital Realty SFO – Santa Clara', lat: 37.354, lng: -121.955, operator: 'Digital Realty' },
      { id: 'known-4', name: 'CyrusOne – Chandler (Sacto Region)', lat: 38.502, lng: -121.493, operator: 'CyrusOne' },
      { id: 'known-5', name: 'Switch SUPERNAP – San Jose', lat: 37.407, lng: -121.934, operator: 'Switch' },
      { id: 'known-6', name: 'CoreSite – Los Angeles', lat: 34.052, lng: -118.243, operator: 'CoreSite' },
      { id: 'known-7', name: 'QTS – Richmond', lat: 37.935, lng: -122.348, operator: 'QTS' },
      { id: 'known-8', name: 'Iron Mountain – Alameda', lat: 37.767, lng: -122.239, operator: 'Iron Mountain' },
      { id: 'known-9', name: 'Vantage SDC – San Jose', lat: 37.394, lng: -122.080, operator: 'Vantage' },
      { id: 'known-10', name: 'NTT San Jose 1', lat: 37.330, lng: -121.892, operator: 'NTT' },
      { id: 'known-11', name: 'Flexential – San Diego', lat: 32.715, lng: -117.156, operator: 'Flexential' },
      { id: 'known-12', name: 'Google – Los Angeles', lat: 33.991, lng: -118.476, operator: 'Google' },
      { id: 'known-13', name: 'Meta – Santa Clara', lat: 37.376, lng: -121.980, operator: 'Meta' },
      { id: 'known-14', name: 'Apple – Newark', lat: 37.524, lng: -122.039, operator: 'Apple' },
      { id: 'known-15', name: 'Cloudflare – San Jose', lat: 37.385, lng: -121.973, operator: 'Cloudflare' },
    ];

    // Merge OSM results with known DCs, deduplicate by proximity
    const allRaw = [...knownDCs, ...rawDCs];
    const deduped = allRaw.filter((dc, idx) =>
      !allRaw.slice(0, idx).some(
        other => Math.abs(other.lat - dc.lat) < 0.005 && Math.abs(other.lng - dc.lng) < 0.005
      )
    );

    const enriched = enrichWithCCA(deduped);

    return NextResponse.json({ dataCenters: enriched, total: enriched.length });
  } catch (err) {
    console.error('Overpass fetch failed:', err);
    // Fallback to known DCs only
    const fallback = enrichWithCCA([
      { id: 'known-1', name: 'Equinix SV1 – San Jose', lat: 37.338, lng: -121.886, operator: 'Equinix' },
      { id: 'known-2', name: 'Equinix LA1 – El Segundo', lat: 33.919, lng: -118.403, operator: 'Equinix' },
      { id: 'known-3', name: 'Digital Realty – Santa Clara', lat: 37.354, lng: -121.955, operator: 'Digital Realty' },
      { id: 'known-4', name: 'CoreSite – Los Angeles', lat: 34.052, lng: -118.243, operator: 'CoreSite' },
      { id: 'known-5', name: 'Switch SUPERNAP – San Jose', lat: 37.407, lng: -121.934, operator: 'Switch' },
      { id: 'known-6', name: 'QTS – Richmond', lat: 37.935, lng: -122.348, operator: 'QTS' },
      { id: 'known-7', name: 'Flexential – San Diego', lat: 32.715, lng: -117.156, operator: 'Flexential' },
    ]);
    return NextResponse.json({ dataCenters: fallback, total: fallback.length, fallback: true });
  }
}
