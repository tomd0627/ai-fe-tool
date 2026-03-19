import { useRef, useEffect } from 'react';
import type { ExplainResponse } from '../types/index.js';
import { PropertyCard } from './PropertyCard.js';

interface Props {
  data: ExplainResponse;
}

export function ResultsPanel({ data }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const outdatedCount = data.properties.filter((p) => p.isOutdated).length;

  return (
    <section className="results-panel" aria-live="polite" aria-label="CSS analysis results">
      <div className="results-panel__header">
        <h2 className="results-panel__heading" ref={headingRef} tabIndex={-1}>
          Analysis Results
        </h2>
        <div className="results-panel__stats" aria-label={`${data.properties.length} properties analyzed, ${outdatedCount} outdated`}>
          <span className="stat">
            <span className="stat__number">{data.properties.length}</span>
            <span className="stat__label">properties</span>
          </span>
          {outdatedCount > 0 && (
            <span className="stat stat--outdated">
              <span className="stat__number">{outdatedCount}</span>
              <span className="stat__label">outdated</span>
            </span>
          )}
        </div>
      </div>

      {data.summary && (
        <p className="results-panel__summary">{data.summary}</p>
      )}

      <div className="results-panel__grid">
        {data.properties.map((prop, i) => (
          <PropertyCard key={`${prop.property}-${i}`} analysis={prop} />
        ))}
      </div>
    </section>
  );
}
