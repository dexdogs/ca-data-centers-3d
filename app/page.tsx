'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DataCenter } from '@/types';
import { CCA_JURISDICTIONS } from '@/lib/cca';
import { PIPELINE_DATA_CENTERS, PipelineDataCenter } from '@/lib/pipeline';
import EPDPanel from './components/EPDPanel';
import CCALegend from './components/CCALegend';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function createPulsingDot(map: mapboxgl.Map, color: string, size: number) {
  const duration = 2000;
  const dot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd() {},
    render() {
      const t = (performance.now() % duration) / duration;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const r = (size / 2) * 0.28;
      const outerRadius = (size / 2) * 0.68 * t + r;
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${1 - t})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      const imageData = ctx.getImageData(0, 0, size, size);
      (this.data as Uint8Array).set(imageData.data);
      map.triggerRepaint();
      return true;
    },
  };
  return dot;
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [dataCenters, setDataCenters] = useState<DataCenter[]>([]);
  const [selectedDC, setSelectedDC] = useState<DataCenter | PipelineDataCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [showPipeline, setShowPipeline] = useState(true);
  const [showExisting, setShowExisting] = useState(true);

  useEffect(() => {
    fetch('/api/datacenters')
      .then(r => r.json())
      .then(d => { setDataCenters(d.dataCenters ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-119.5, 36.7],
      zoom: 6,
      pitch: 30,
      antialias: true,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.on('load', () => {
      const m = map.current!;
      CCA_JURISDICTIONS.forEach(j => {
        const [west, south, east, north] = j.bounds;
        m.addSource(`cca-${j.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] },
            properties: {},
          },
        });
        m.addLayer({ id: `cca-fill-${j.id}`, type: 'fill', source: `cca-${j.id}`, paint: { 'fill-color': j.color, 'fill-opacity': 0.08 } });
        m.addLayer({ id: `cca-line-${j.id}`, type: 'line', source: `cca-${j.id}`, paint: { 'line-color': j.color, 'line-width': 1.5, 'line-dasharray': [3, 3], 'line-opacity': 0.6 } });
      });
      m.addImage('pulsing-dot', createPulsingDot(m, '#ffaa00', 80) as Parameters<typeof m.addImage>[1], { pixelRatio: 2 });
      setMapReady(true);
    });
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  const addDataLayers = useCallback(() => {
    const m = map.current;
    if (!m || !mapReady || dataCenters.length === 0) return;
    ['dc-heat', 'dc-markers', 'dc-labels', 'pipeline-markers', 'pipeline-labels'].forEach(id => { if (m.getLayer(id)) m.removeLayer(id); });
    ['data-centers', 'pipeline-dcs'].forEach(id => { if (m.getSource(id)) m.removeSource(id); });

    // Existing DCs
    m.addSource('data-centers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: dataCenters.map(dc => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [dc.lng, dc.lat] },
          properties: { id: dc.id, name: dc.name, operator: dc.operator ?? '', inCCA: dc.inCCAJurisdiction ? 1 : 0 },
        })),
      },
    });

    m.addLayer({
      id: 'dc-heat', type: 'heatmap', source: 'data-centers', maxzoom: 11,
      layout: { visibility: showExisting ? 'visible' : 'none' },
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'inCCA'], 0, 0.4, 1, 1.0],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 2],
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.2, 'rgba(0,80,120,0.6)', 0.4, 'rgba(0,180,150,0.7)',
          0.6, 'rgba(0,220,100,0.8)', 0.8, 'rgba(60,255,120,0.9)', 1.0, 'rgba(255,255,100,1)'],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 18, 10, 45],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.9, 11, 0],
      },
    });

    m.addLayer({
      id: 'dc-markers', type: 'circle', source: 'data-centers', minzoom: 6,
      layout: { visibility: showExisting ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 5, 12, 14],
        'circle-color': ['case', ['==', ['get', 'inCCA'], 1], '#00ff88', '#4a4a6a'],
        'circle-stroke-color': ['case', ['==', ['get', 'inCCA'], 1], 'rgba(0,255,136,0.4)', 'rgba(100,100,140,0.3)'],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 6, 2, 12, 6],
        'circle-opacity': 0.9,
      },
    });

    m.addLayer({
      id: 'dc-labels', type: 'symbol', source: 'data-centers', minzoom: 9,
      layout: {
        visibility: showExisting ? 'visible' : 'none',
        'text-field': ['get', 'name'], 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11, 'text-offset': [0, 1.5], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#e0e0ff', 'text-halo-color': 'rgba(0,0,0,0.8)', 'text-halo-width': 1.5 },
    });

    // Pipeline DCs
    m.addSource('pipeline-dcs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: PIPELINE_DATA_CENTERS.map(dc => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [dc.lng, dc.lat] },
          properties: { id: dc.id, name: dc.name, operator: dc.operator ?? '', permitStatus: dc.permitStatus, powerMW: dc.powerMW ?? 0, estCompletionYear: dc.estCompletionYear, inCCA: dc.inCCAJurisdiction ? 1 : 0 },
        })),
      },
    });

    m.addLayer({
      id: 'pipeline-markers', type: 'symbol', source: 'pipeline-dcs', minzoom: 5,
      layout: {
        visibility: showPipeline ? 'visible' : 'none',
        'icon-image': 'pulsing-dot', 'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.35, 10, 0.65, 14, 0.95],
      },
    });

    m.addLayer({
      id: 'pipeline-labels', type: 'symbol', source: 'pipeline-dcs', minzoom: 8,
      layout: {
        visibility: showPipeline ? 'visible' : 'none',
        'text-field': ['concat', ['get', 'name'], '\n', ['get', 'permitStatus']],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 10, 'text-offset': [0, 2.2], 'text-anchor': 'top', 'text-optional': true,
      },
      paint: { 'text-color': '#ffaa00', 'text-halo-color': 'rgba(0,0,0,0.9)', 'text-halo-width': 1.5 },
    });

    ['dc-markers', 'pipeline-markers'].forEach(layerId => {
      m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = ''; });
    });

    m.on('click', 'dc-markers', e => {
      const id = e.features?.[0]?.properties?.id;
      const dc = dataCenters.find(d => d.id === id);
      if (dc) setSelectedDC(dc);
    });
    m.on('click', 'pipeline-markers', e => {
      const id = e.features?.[0]?.properties?.id;
      const dc = PIPELINE_DATA_CENTERS.find(d => d.id === id);
      if (dc) setSelectedDC(dc);
    });
  }, [mapReady, dataCenters, showPipeline, showExisting]);

  useEffect(() => { addDataLayers(); }, [addDataLayers]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    ['dc-heat', 'dc-markers', 'dc-labels'].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', showExisting ? 'visible' : 'none');
    });
  }, [showExisting, mapReady]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    ['pipeline-markers', 'pipeline-labels'].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', showPipeline ? 'visible' : 'none');
    });
  }, [showPipeline, mapReady]);

  const ccaDCCount = dataCenters.filter(d => d.inCCAJurisdiction).length;
  const ccaPipelineCount = PIPELINE_DATA_CENTERS.filter(d => d.inCCAJurisdiction).length;
  const isPipeline = selectedDC && 'permitStatus' in selectedDC;

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a12' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 264 }}>
        <CCALegend
          totalDCs={dataCenters.length}
          ccaDCs={ccaDCCount}
          pipelineTotal={PIPELINE_DATA_CENTERS.length}
          ccaPipeline={ccaPipelineCount}
          isLoading={loading}
          showPipeline={showPipeline}
          showExisting={showExisting}
          onTogglePipeline={() => setShowPipeline(v => !v)}
          onToggleExisting={() => setShowExisting(v => !v)}
        />
      </div>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20, background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 8, padding: '20px 32px', color: '#00ff88', fontFamily: 'monospace', fontSize: 13 }}>
          ◌ Fetching CA data centers from OSM…
        </div>
      )}
      {selectedDC && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 380, zIndex: 10, overflowY: 'auto' }}>
          <EPDPanel selectedDC={selectedDC} isPipeline={!!isPipeline} onClose={() => setSelectedDC(null)} />
        </div>
      )}
    </main>
  );
}
