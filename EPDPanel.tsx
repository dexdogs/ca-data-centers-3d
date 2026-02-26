'use client';
import { useEffect, useState, useCallback } from 'react';
import { EPD, DataCenter } from '@/types';
import { PipelineDataCenter } from '@/lib/pipeline';

const MATERIAL_CATEGORIES = [
  { id: 'ReadyMix', label: 'Ready-Mix Concrete' },
  { id: 'SteelSection', label: 'Structural Steel' },
  { id: 'RebarAndRod', label: 'Rebar' },
  { id: 'CMU', label: 'CMU Block' },
  { id: 'SteelDeck', label: 'Steel Deck' },
];

interface EPDPanelProps {
  selectedDC: DataCenter | PipelineDataCenter;
  isPipeline: boolean;
  onClose: () => void;
}

export default function EPDPanel({ selectedDC, isPipeline, onClose }: EPDPanelProps) {
  const [epds, setEpds] = useState<EPD[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ReadyMix');
  const [categoryLabel, setCategoryLabel] = useState('Ready-Mix Concrete');
  const [isMock, setIsMock] = useState(false);
  const pipeline = selectedDC as PipelineDataCenter;

  const fetchEPDs = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const jurisdiction = selectedDC?.ccaJurisdiction?.id ?? '';
      const res = await fetch(`/api/epds?category=${category}&jurisdiction=${jurisdiction}`);
      const data = await res.json();
      setEpds(data.epds ?? []);
      setCategoryLabel(data.category ?? category);
      setIsMock(data.source === 'mock');
    } catch { setEpds([]); }
    finally { setLoading(false); }
  }, [selectedDC]);

  useEffect(() => {
    if (selectedDC?.inCCAJurisdiction) fetchEPDs(activeCategory);
  }, [selectedDC, activeCategory, fetchEPDs]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {isPipeline && <span className="pipeline-badge">PIPELINE</span>}
            <h2 className="panel-title">{selectedDC.name}</h2>
          </div>
          {selectedDC.operator && <p className="panel-subtitle">{selectedDC.operator}</p>}
        </div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      {/* Pipeline project details */}
      {isPipeline && (
        <div className="pipeline-info">
          <p className="info-label">PROJECT STATUS</p>
          <div className="pipeline-status-row">
            <span className="pipeline-status-badge">{pipeline.permitStatus}</span>
            <span className="pipeline-year">Est. completion {pipeline.estCompletionYear}</span>
          </div>
          <div className="pipeline-grid">
            {pipeline.powerMW && (
              <div className="pipeline-stat">
                <p className="pipeline-stat-val">{pipeline.powerMW} MW</p>
                <p className="pipeline-stat-label">Capacity</p>
              </div>
            )}
            {pipeline.sizeSqft && (
              <div className="pipeline-stat">
                <p className="pipeline-stat-val">{(pipeline.sizeSqft / 1000).toFixed(0)}k</p>
                <p className="pipeline-stat-label">Sq Ft</p>
              </div>
            )}
            {pipeline.permitDate && (
              <div className="pipeline-stat">
                <p className="pipeline-stat-val">{pipeline.permitDate.slice(0, 7)}</p>
                <p className="pipeline-stat-label">Permit Date</p>
              </div>
            )}
          </div>
          <p className="info-label" style={{ marginTop: 8 }}>APPROVAL BODY</p>
          <p className="info-text">{pipeline.approvalBody}</p>
          {pipeline.notes && (
            <>
              <p className="info-label" style={{ marginTop: 8 }}>NOTES</p>
              <p className="info-text">{pipeline.notes}</p>
            </>
          )}
          {pipeline.sourceUrl && (
            <a href={pipeline.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
              View source ↗
            </a>
          )}
        </div>
      )}

      {/* Compliance Status */}
      <div className={`cca-badge ${selectedDC.inCCAJurisdiction ? 'cca-active' : 'cca-inactive'}`}>
        {selectedDC.inCCAJurisdiction ? (
          <>
            <span className="badge-dot active" />
            <div>
              {isPipeline ? (
                <>
                  <p className="badge-title">CALGreen §5.409 Required at Permit</p>
                  <p className="badge-sub">Title 24 Part 11 — Whole-building LCA or EPD pathway</p>
                </>
              ) : (
                <>
                  <p className="badge-title">In Active CALGreen §5.409 Jurisdiction</p>
                  <p className="badge-sub">Applies to new construction & major renovation &gt;100k sqft</p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="badge-dot inactive" />
            <div>
              <p className="badge-title">Outside Mapped CCA Jurisdiction</p>
              <p className="badge-sub">CALGreen §5.409 still applies statewide at permit for &gt;100k sqft</p>
            </div>
          </>
        )}
      </div>

      {/* Regulation context box */}
      {selectedDC.inCCAJurisdiction && (
        <>
          <div className="jurisdiction-info">
            <p className="info-label">APPLICABLE REGULATION</p>
            <p className="info-text">{selectedDC.ccaJurisdiction?.description}</p>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="reg-row">
                <span className="reg-tag active">✓ In force</span>
                <span className="reg-name">CALGreen §5.409 (Title 24 Part 11) — since Jul 2024</span>
              </div>
              <div className="reg-row">
                <span className="reg-tag active">✓ In force</span>
                <span className="reg-name">AB 262 Buy Clean CA Act — state-funded projects only</span>
              </div>
              <div className="reg-row">
                <span className="reg-tag pending">◌ Pending</span>
                <span className="reg-name">AB 2446 / AB 43 — CARB framework, not yet enforceable</span>
              </div>
            </div>
          </div>

          <div>
            <p className="section-label">
              {isPipeline
                ? 'EPDs REQUIRED AT PERMIT — CALGreen §5.409 PRESCRIPTIVE PATH'
                : 'EPD REFERENCE DATA — CALGreen §5.409 REGULATED MATERIALS'}
            </p>
            <div className="category-tabs">
              {MATERIAL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="epd-list">
            {loading ? (
              <div className="loading-state"><div className="spinner" /><p>Fetching EPDs from EC3…</p></div>
            ) : (
              <>
                <div className="epd-list-header">
                  <span className="epd-list-title">{categoryLabel}</span>
                  {isMock && <span className="mock-badge">Demo Data</span>}
                </div>
                {epds.map(epd => <EPDCard key={epd.id} epd={epd} />)}
                {epds.length === 0 && <p className="no-results">No EPDs found for this category.</p>}
              </>
            )}
          </div>

          <div className="ec3-attribution">
            <span>EPD data powered by</span>
            <a href="https://buildingtransparency.org" target="_blank" rel="noopener noreferrer">
              EC3 / Building Transparency ↗
            </a>
          </div>
        </>
      )}

      {!selectedDC.inCCAJurisdiction && (
        <div className="outside-cca">
          <p>This facility is outside the mapped CCA jurisdiction boundaries.</p>
          <p>However, <strong>CALGreen §5.409 applies statewide</strong> — any new construction or major renovation over 100,000 sqft (50,000 sqft from Jan 2026) requires EPD documentation or a whole-building LCA regardless of location.</p>
          <p style={{ marginTop: 8 }}>AB 262 Buy Clean CA Act applies if any state funding is involved.</p>
        </div>
      )}
    </div>
  );
}

function EPDCard({ epd }: { epd: EPD }) {
  const statusColor = epd.complianceStatus === 'compliant' ? '#00ff88' : epd.complianceStatus === 'at-risk' ? '#ffcc00' : '#666';
  const reductionVal = epd.gwpReduction ?? 0;
  return (
    <div className="epd-card">
      <div className="epd-card-top">
        <div className="epd-name-block">
          <p className="epd-name">{epd.name}</p>
          {epd.manufacturer && <p className="epd-mfr">{epd.manufacturer}</p>}
        </div>
        <div className="epd-gwp-block" style={{ color: statusColor }}>
          <p className="epd-gwp-value">{epd.gwp < 10 ? epd.gwp.toFixed(2) : Math.round(epd.gwp)}</p>
          <p className="epd-gwp-unit">kgCO₂e/{epd.declaredUnit}</p>
        </div>
      </div>
      <div className="epd-bar-wrap">
        <div className="epd-bar" style={{ width: `${Math.min(100, Math.max(5, 100 - reductionVal))}%`, backgroundColor: statusColor }} />
      </div>
      <div className="epd-meta">
        <span className="epd-status" style={{ color: statusColor, borderColor: statusColor }}>
          {epd.complianceStatus === 'compliant' ? '✓ Compliant' : epd.complianceStatus === 'at-risk' ? '⚠ At Risk' : '? Unverified'}
        </span>
        {reductionVal > 0 && <span className="epd-reduction">{reductionVal}% below baseline</span>}
        <a href={epd.ec3Url} target="_blank" rel="noopener noreferrer" className="epd-link">View in EC3 ↗</a>
      </div>
    </div>
  );
}
