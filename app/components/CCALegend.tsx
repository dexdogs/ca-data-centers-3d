'use client';
import { CCA_JURISDICTIONS } from '@/lib/cca';

interface CCALegendProps {
  totalDCs: number;
  ccaDCs: number;
  isLoading: boolean;
}

export default function CCALegend({ totalDCs, ccaDCs, isLoading }: CCALegendProps) {
  return (
    <div className="legend-panel">
      <div className="legend-header">
        <span className="legend-icon">⬡</span>
        <h1 className="legend-title">CA Data Centers</h1>
        <p className="legend-sub">Embodied Carbon Compliance</p>
      </div>

      <div className="legend-stats">
        <div className="stat-block">
          <p className="stat-num">{isLoading ? '—' : totalDCs}</p>
          <p className="stat-label">Total Facilities</p>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <p className="stat-num cca-num">{isLoading ? '—' : ccaDCs}</p>
          <p className="stat-label">In CCA Zones</p>
        </div>
      </div>

      <div className="legend-section">
        <p className="legend-section-label">MARKERS</p>
        <div className="legend-row">
          <span className="dot green" />
          <span>In CCA Jurisdiction (AB 2446)</span>
        </div>
        <div className="legend-row">
          <span className="dot gray" />
          <span>Outside CCA Zone</span>
        </div>
      </div>

      <div className="legend-section">
        <p className="legend-section-label">CCA JURISDICTIONS</p>
        {CCA_JURISDICTIONS.map(j => (
          <div key={j.id} className="legend-row">
            <span className="jurisdiction-swatch" style={{ backgroundColor: j.color }} />
            <div>
              <p className="j-short">{j.shortName}</p>
              <p className="j-long">{j.name.split(' Air')[0]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="legend-footer">
        <p>AB 2446 requires whole-building LCAs and EPD submissions for large commercial projects.</p>
        <p>Click any marker to view EPD data.</p>
      </div>
    </div>
  );
}
