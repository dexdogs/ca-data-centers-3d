export interface DataCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  powerMW?: number;
  operator?: string;
  address?: string;
  inCCAJurisdiction: boolean;
  ccaJurisdiction?: CCAJurisdiction;
}

export interface CCAJurisdiction {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
  regulationYear?: number;
  bounds: [number, number, number, number]; // [west, south, east, north]
}

export interface EPD {
  id: string;
  name: string;
  manufacturer?: string;
  category: string;
  gwp: number; // kg CO2e per declared unit
  declaredUnit: string;
  validUntil?: string;
  ec3Url: string;
  complianceStatus: 'compliant' | 'at-risk' | 'unknown';
  gwpBaseline?: number;
  gwpReduction?: number; // percentage below baseline
}

export interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'name:en'?: string;
    operator?: string;
    power?: string;
    building?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassWay {
  type: 'way';
  id: number;
  center?: { lat: number; lon: number };
  tags: OverpassNode['tags'];
}

export type OverpassElement = OverpassNode | OverpassWay;
