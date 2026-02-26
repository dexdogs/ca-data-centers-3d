'use client';
import { CCA_JURISDICTIONS } from '@/lib/cca';

interface CCALegendProps {
  totalDCs: number;
  ccaDCs: number;
  pipelineTotal: number;
  ccaPipeline: number;
  isLoading: boolean;
  showPipeline: boolean;
  showExisting: boolean;
  onTogglePipeline: () => void;
  onToggleExisting: () => void;
}

export default function CCALegend({ totalDCs, ccaDCs, pipelineTotal, ccaPipeline, isLoading, showPipeline, showExisting, onTogglePipeline, onToggleExisting }: CCALegendProps) {
  return (
    <div className="legend-panel">
      <div className="legend-header">
        <span className="legend-icon">⬡</span>
        <h1 className="legend-title">CA Data Centers</h1>
        <p className="legend-sub">Embodied Carbon Compliance</p>
      </div>

      {/* Stats */}
      <div className="legend-stats">
        <div className="stat-block">
          <p className="stat-num">{isLoading ? '—' : totalDCs}</p>
          <p className="stat-label">Existing</p>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <p className="stat-num" style={{ color: '#ffaa00' }}>{pipelineTotal}</p>
          <p className="stat-label">Pipeline</p>
        </div>
        <div className="stat-divider" />
        <div className="stat-block">
          <p className="stat-num cca-num">{isLoading ? '—' : ccaDCs + ccaPipeline}</p>
          <p className="stat-label">In CCA Zones</p>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="legend-section">
        <p className="legend-section-label">LAYERS</p>
        <div className="toggle-row" onClick={onToggleExisting}>
          <div className={`toggle-switch ${showExisting ? 'on' : 'off'}`} />
          <span className="dot green" />
          <span>Existing Facilities ({isLoading ? '…' : totalDCs})</span>
        </div>
        <div className="toggle-row" onClick={onTogglePipeline}>
          <div className={`toggle-switch ${showPipeline ? 'on-orange' : 'off'}`} />
          <span className="dot orange" />
          <span>Pipeline / Permitted ({pipelineTotal})</span>
        </div>
      </div>

      {/* Marker Legend */}
      <div className="legend-section">
        <p className="legend-section-label">MARKERS</p>
        <div className="legend-row"><span className="dot green" /><span>Existing — In CCA Jurisdiction</span></div>
        <div className="legend-row"><span className="dot gray" /><span>Existing — Outside CCA Zone</span></div>
        <div className="legend-row"><span className="dot orange pulse" /><span>Pipeline — Permitted / Approved</span></div>
      </div>

      {/* CCA Jurisdictions */}
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
        <p>Click any marker to view details + EPD data.</p>
        <p>Pipeline = permitted/approved, not yet built.</p>
      </div>
    </div>
  );
}
