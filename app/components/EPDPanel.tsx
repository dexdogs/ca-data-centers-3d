'use client';
import { useEffect, useState, useCallback } from 'react';
import { EPD, DataCenter } from '@/types';

const MATERIAL_CATEGORIES = [
  { id: 'ReadyMix', label: 'Ready-Mix Concrete' },
  { id: 'SteelSection', label: 'Structural Steel' },
  { id: 'RebarAndRod', label: 'Rebar' },
  { id: 'CMU', label: 'CMU Block' },
  { id: 'SteelDeck', label: 'Steel Deck' },
];

interface EPDPanelProps {
  selectedDC: DataCenter | null;
  onClose: () => void;
}

export default function EPDPanel({ selectedDC, onClose }: EPDPanelProps) {
  const [epds, setEpds] = useState<EPD[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ReadyMix');
  const [categoryLabel, setCategoryLabel] = useState('Ready-Mix Concrete');
  const [isMock, setIsMock] = useState(false);

  const fetchEPDs = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const jurisdiction = selectedDC?.ccaJurisdiction?.id ?? '';
      const res = await fetch(`/api/epds?category=${category}&jurisdiction=${jurisdiction}`);
      const data = await res.json();
      setEpds(data.epds ?? []);
      setCategoryLabel(data.category ?? category);
      setIsMock(data.source === 'mock');
    } catch {
      setEpds([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDC]);

  useEffect(() => {
    if (selectedDC?.inCCAJurisdiction) {
      fetchEPDs(activeCategory);
    }
  }, [selectedDC, activeCategory, fetchEPDs]);

  if (!selectedDC) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{selectedDC.name}</h2>
          {selectedDC.operator && (
            <p className="panel-subtitle">{selectedDC.operator}</p>
          )}
        </div>
        <button onClick={onClose} className="close-btn" aria-label="Close">✕</button>
      </div>

      {/* CCA Status Badge */}
      <div className={`cca-badge ${selectedDC.inCCAJurisdiction ? 'cca-active' : 'cca-inactive'}`}>
        {selectedDC.inCCAJurisdiction ? (
          <>
            <span className="badge-dot active" />
            <div>
              <p className="badge-title">AB 2446 / CALGreen EC Required</p>
              <p className="badge-sub">{selectedDC.ccaJurisdiction?.name}</p>
            </div>
          </>
        ) : (
          <>
            <span className="badge-dot inactive" />
            <div>
              <p className="badge-title">Outside CCA Jurisdiction</p>
              <p className="badge-sub">State minimums apply only</p>
            </div>
          </>
        )}
      </div>

      {selectedDC.inCCAJurisdiction && (
        <>
          <div className="jurisdiction-info">
            <p className="info-label">REGULATION CONTEXT</p>
            <p className="info-text">{selectedDC.ccaJurisdiction?.description}</p>
            {selectedDC.ccaJurisdiction?.regulationYear && (
              <p className="info-year">Effective {selectedDC.ccaJurisdiction.regulationYear}</p>
            )}
          </div>

          {/* Material Category Tabs */}
          <div>
            <p className="section-label">EPD DATA — AB 2446 REGULATED MATERIALS</p>
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

          {/* EPD Results */}
          <div className="epd-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Fetching EPDs from EC3…</p>
              </div>
            ) : (
              <>
                <div className="epd-list-header">
                  <span className="epd-list-title">{categoryLabel}</span>
                  {isMock && <span className="mock-badge">Demo Data</span>}
                </div>
                {epds.map(epd => (
                  <EPDCard key={epd.id} epd={epd} />
                ))}
                {epds.length === 0 && (
                  <p className="no-results">No EPDs found for this category.</p>
                )}
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
          <p>This facility is outside defined CCA jurisdiction boundaries.</p>
          <p>State-level AB 2446 requirements apply when building new construction exceeds 10,000 sqft.</p>
        </div>
      )}
    </div>
  );
}

function EPDCard({ epd }: { epd: EPD }) {
  const statusColor = epd.complianceStatus === 'compliant'
    ? '#00ff88' : epd.complianceStatus === 'at-risk' ? '#ffcc00' : '#666';

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
      <div className="epd-card-bottom">
        <div className="epd-bar-wrap">
          <div
            className="epd-bar"
            style={{
              width: `${Math.min(100, Math.max(5, 100 - reductionVal))}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
        <div className="epd-meta">
          <span
            className="epd-status"
            style={{ color: statusColor, borderColor: statusColor }}
          >
            {epd.complianceStatus === 'compliant' ? '✓ Compliant'
              : epd.complianceStatus === 'at-risk' ? '⚠ At Risk'
              : '? Unverified'}
          </span>
          {reductionVal > 0 && (
            <span className="epd-reduction">{reductionVal}% below baseline</span>
          )}
          <a href={epd.ec3Url} target="_blank" rel="noopener noreferrer" className="epd-link">
            View in EC3 ↗
          </a>
        </div>
      </div>
    </div>
  );
}
