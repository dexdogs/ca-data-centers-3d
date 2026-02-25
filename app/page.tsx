'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DataCenter } from '@/types';
import { CCA_JURISDICTIONS } from '@/lib/cca';
import EPDPanel from './components/EPDPanel';
import CCALegend from './components/CCALegend';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [dataCenters, setDataCenters] = useState<DataCenter[]>([]);
  const [selectedDC, setSelectedDC] = useState<DataCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Fetch data centers
  useEffect(() => {
    fetch('/api/datacenters')
      .then(r => r.json())
      .then(d => {
        setDataCenters(d.dataCenters ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Initialize Mapbox
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-119.5, 36.7],
      zoom: 6,
      pitch: 30,
      bearing: 0,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      const m = map.current!;

      // ── CCA Jurisdiction fill layers ──────────────────────────────────
      CCA_JURISDICTIONS.forEach(j => {
        const [west, south, east, north] = j.bounds;

        m.addSource(`cca-${j.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [west, south], [east, south],
                [east, north], [west, north], [west, south],
              ]],
            },
            properties: { id: j.id, name: j.name, shortName: j.shortName },
          },
        });

        m.addLayer({
          id: `cca-fill-${j.id}`,
          type: 'fill',
          source: `cca-${j.id}`,
          paint: {
            'fill-color': j.color,
            'fill-opacity': 0.08,
          },
        });

        m.addLayer({
          id: `cca-line-${j.id}`,
          type: 'line',
          source: `cca-${j.id}`,
          paint: {
            'line-color': j.color,
            'line-width': 1.5,
            'line-dasharray': [3, 3],
            'line-opacity': 0.6,
          },
        });
      });

      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add/update data layers when both map and data are ready
  const addDataLayers = useCallback(() => {
    const m = map.current;
    if (!m || !mapReady || dataCenters.length === 0) return;

    // Remove existing data layers if re-running
    ['dc-heat', 'dc-markers', 'dc-labels'].forEach(id => {
      if (m.getLayer(id)) m.removeLayer(id);
    });
    if (m.getSource('data-centers')) m.removeSource('data-centers');

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: dataCenters.map(dc => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [dc.lng, dc.lat] },
        properties: {
          id: dc.id,
          name: dc.name,
          operator: dc.operator ?? '',
          inCCA: dc.inCCAJurisdiction ? 1 : 0,
          ccaName: dc.ccaJurisdiction?.shortName ?? '',
        },
      })),
    };

    m.addSource('data-centers', { type: 'geojson', data: geojson });

    // ── Heatmap layer ─────────────────────────────────────────────────
    m.addLayer({
      id: 'dc-heat',
      type: 'heatmap',
      source: 'data-centers',
      maxzoom: 11,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'inCCA'], 0, 0.4, 1, 1.0],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 2],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,    'rgba(0,0,0,0)',
          0.2,  'rgba(0,80,120,0.6)',
          0.4,  'rgba(0,180,150,0.7)',
          0.6,  'rgba(0,220,100,0.8)',
          0.8,  'rgba(60,255,120,0.9)',
          1.0,  'rgba(255,255,100,1)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 18, 10, 45],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.9, 11, 0],
      },
    });

    // ── Circle markers ────────────────────────────────────────────────
    m.addLayer({
      id: 'dc-markers',
      type: 'circle',
      source: 'data-centers',
      minzoom: 6,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 5, 12, 14],
        'circle-color': [
          'case',
          ['==', ['get', 'inCCA'], 1], '#00ff88',
          '#4a4a6a',
        ],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'inCCA'], 1], 'rgba(0,255,136,0.4)',
          'rgba(100,100,140,0.3)',
        ],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 6, 2, 12, 6],
        'circle-opacity': 0.9,
      },
    });

    // ── Labels ────────────────────────────────────────────────────────
    m.addLayer({
      id: 'dc-labels',
      type: 'symbol',
      source: 'data-centers',
      minzoom: 9,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#e0e0ff',
        'text-halo-color': 'rgba(0,0,0,0.8)',
        'text-halo-width': 1.5,
      },
    });

    // ── Hover & click ─────────────────────────────────────────────────
    m.on('mouseenter', 'dc-markers', () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'dc-markers', () => {
      m.getCanvas().style.cursor = '';
    });

    m.on('click', 'dc-markers', e => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      const dc = dataCenters.find(d => d.id === props.id);
      if (dc) setSelectedDC(dc);
    });
  }, [mapReady, dataCenters]);

  useEffect(() => {
    addDataLayers();
  }, [addDataLayers]);

  const ccaDCCount = dataCenters.filter(d => d.inCCAJurisdiction).length;

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a12' }}>
      {/* Map */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Legend panel - top left */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 260 }}>
        <CCALegend
          totalDCs={dataCenters.length}
          ccaDCs={ccaDCCount}
          isLoading={loading}
        />
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 20,
          background: 'rgba(10,10,20,0.9)',
          border: '1px solid rgba(0,255,136,0.3)',
          borderRadius: 8, padding: '20px 32px',
          color: '#00ff88', fontFamily: 'monospace', fontSize: 13,
        }}>
          ◌ Fetching CA data centers from OSM…
        </div>
      )}

      {/* EPD Panel - right side */}
      {selectedDC && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 380, zIndex: 10, overflowY: 'auto',
        }}>
          <EPDPanel selectedDC={selectedDC} onClose={() => setSelectedDC(null)} />
        </div>
      )}
    </main>
  );
}
