import { DataCenter } from '@/types';
import { enrichWithCCA } from '@/lib/cca';

const RAW_PIPELINE = [
  { id: 'pipeline-1', name: 'Amazon East Gilroy Campus', operator: 'Amazon Web Services', lat: 37.002, lng: -121.568, sizeSqft: 438500, powerMW: 200, permitStatus: 'Approved', permitDate: '2025-07-03', approvalBody: 'City of Gilroy', estCompletionYear: 2027, notes: 'Two-phase 56-acre campus. Phase 2 uses BESS/fuel cells for backup. AWS US-West-1 expansion.', sourceUrl: 'https://www.datacenterdynamics.com/en/news/amazon-data-services-gains-approval-for-data-center-on-56-acres-in-gilroy-california/' },
  { id: 'pipeline-2', name: 'GI Partners Bowers Data Center', operator: 'GI Partners', lat: 37.380, lng: -121.978, sizeSqft: 244070, powerMW: 72, permitStatus: 'Approved', permitDate: '2024-08-01', approvalBody: 'City of Santa Clara', estCompletionYear: 2029, notes: '4-story, 5-acre redevelopment at 2805 Bowers Ave. New substation included.', sourceUrl: 'https://www.datacenterdynamics.com/en/news/gi-partners-secures-planning-permission-for-72mw-data-center-in-santa-clara-california/' },
  { id: 'pipeline-3', name: 'Terra Ventures / Arcadis Sustainable DC', operator: 'Terra Ventures', lat: 37.395, lng: -121.924, sizeSqft: 295080, powerMW: 60, permitStatus: 'Application Filed', permitDate: '2025-02-01', approvalBody: 'City of San Jose Planning Dept', estCompletionYear: 2028, notes: 'Near net-zero design. Bloom Energy fuel cells, absorption chillers, on-site greenhouse.', sourceUrl: 'https://www.datacenterdynamics.com/en/news/natural-gas-powered-data-center-pitched-in-san-jose-california/' },
  { id: 'pipeline-4', name: 'Imperial Valley Hyperscale Campus', operator: 'Imperial Valley Data Centers LLC', lat: 32.848, lng: -115.569, sizeSqft: 1500000, powerMW: 330, permitStatus: 'Grading Permit Issued', permitDate: '2025-11-06', approvalBody: 'Imperial County', estCompletionYear: 2030, notes: '74-acre site at Aten & Clark Roads. 330MW backup generation, 862MWh BESS.', sourceUrl: 'https://www.ivpressonline.com/news/major-hyperscale-data-center-proposed-near-imperial' },
  { id: 'pipeline-5', name: 'Goodman Group Silicon Valley DC', operator: 'Goodman Group', lat: 37.388, lng: -121.933, sizeSqft: 500350, powerMW: 120, permitStatus: 'Land Acquired', permitDate: '2025-10-28', approvalBody: 'Santa Clara County', estCompletionYear: 2028, notes: '45.8-acre site at 350 & 370 W Trimble Rd. Acquired for $200M.', sourceUrl: 'https://www.blackridgeresearch.com/blog/latest-list-of-upcoming-data-centers-in-california-united-states-us' },
  { id: 'pipeline-6', name: 'Prime Data Centers Sacramento Building 2', operator: 'Prime Data Centers', lat: 38.668, lng: -121.374, sizeSqft: 110000, powerMW: 32, permitStatus: 'Pre-Application Filed', permitDate: '2025-01-01', approvalBody: 'Sacramento County', estCompletionYear: 2027, notes: 'Adjacent to existing Building-1 at McClellan Park. 7.74 acres at 2407 Ak St.', sourceUrl: 'https://www.blackridgeresearch.com/blog/latest-list-of-upcoming-data-centers-in-california-united-states-us' },
  { id: 'pipeline-7', name: 'HMC Capital DigiCo LAX1', operator: 'HMC Capital / DigiCo REIT', lat: 34.063, lng: -118.130, sizeSqft: 400000, powerMW: 56, permitStatus: 'Planned', permitDate: '2025-06-01', approvalBody: 'City of Monterey Park', estCompletionYear: 2028, notes: '15.8-acre site at 1977 Saturn St, Monterey Park.', sourceUrl: 'https://www.blackridgeresearch.com/blog/latest-list-of-upcoming-data-centers-in-california-united-states-us' },
  { id: 'pipeline-8', name: 'CyrusOne / Ameresco NorCal Campus', operator: 'CyrusOne', lat: 37.510, lng: -122.020, sizeSqft: 300000, powerMW: 100, permitStatus: 'Planned', permitDate: '2025-09-01', approvalBody: 'Santa Clara County', estCompletionYear: 2028, notes: 'Ameresco partnership for sustainable 100MW campus in Northern California.', sourceUrl: 'https://www.blackridgeresearch.com/blog/latest-list-of-upcoming-data-centers-in-california-united-states-us' },
  { id: 'pipeline-9', name: 'Vernon Industrial DC Campus', operator: 'Undisclosed', lat: 33.995, lng: -118.217, sizeSqft: 250000, powerMW: 80, permitStatus: 'Planned', permitDate: '2026-01-01', approvalBody: 'City of Vernon', estCompletionYear: 2027, notes: 'City of Vernon tapping remaining power capacity for new data center development.', sourceUrl: 'https://www.globest.com/amp/2026/02/20/investors-eye-data-center-construction-in-california-as-availability-remains-scarce/' },
  { id: 'pipeline-10', name: 'PG&E Cluster Study — Sunnyvale Site', operator: 'Undisclosed Hyperscaler', lat: 37.368, lng: -122.036, sizeSqft: 200000, powerMW: 75, permitStatus: 'PG&E Interconnection Queue', permitDate: '2024-01-01', approvalBody: 'PG&E / CPUC', estCompletionYear: 2027, notes: "One of 27 unique sites in PG&E's 1.4GW cluster study.", sourceUrl: 'https://investor.pgecorp.com/news-events/press-releases/press-release-details/2025/PGE-Accelerating-Connection-of-New-Data-Centers-throughout-Northern-and-Central-California/default.aspx' },
  { id: 'pipeline-11', name: 'PG&E Cluster Study — East Bay Site', operator: 'Undisclosed Hyperscaler', lat: 37.812, lng: -122.178, sizeSqft: 180000, powerMW: 60, permitStatus: 'PG&E Interconnection Queue', permitDate: '2024-01-01', approvalBody: 'PG&E / CPUC', estCompletionYear: 2028, notes: "Part of PG&E's 740MW cluster study for Silicon Valley overflow submarkets.", sourceUrl: 'https://investor.pgecorp.com/news-events/press-releases/press-release-details/2025/PGE-Accelerating-Connection-of-New-Data-Centers-throughout-Northern-and-Central-California/default.aspx' },
  { id: 'pipeline-12', name: 'Rowan Digital Infrastructure — NorCal', operator: 'Rowan Digital Infrastructure', lat: 37.440, lng: -122.143, sizeSqft: 220000, powerMW: 90, permitStatus: 'Planned', permitDate: '2025-12-01', approvalBody: 'Santa Clara County', estCompletionYear: 2028, notes: 'Rowan plans to invest in CA data center. Focused on powered land opportunities.', sourceUrl: 'https://baxtel.com/data-center/california' },
];

export type PipelineDataCenter = DataCenter & {
  sizeSqft?: number;
  powerMW?: number;
  permitStatus: string;
  permitDate: string;
  approvalBody: string;
  estCompletionYear: number;
  notes: string;
  sourceUrl: string;
  status: 'pipeline';
};

export const PIPELINE_DATA_CENTERS: PipelineDataCenter[] = enrichWithCCA(
  RAW_PIPELINE.map(p => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, operator: p.operator }))
).map((dc, i) => ({ ...dc, ...RAW_PIPELINE[i], status: 'pipeline' as const }));
