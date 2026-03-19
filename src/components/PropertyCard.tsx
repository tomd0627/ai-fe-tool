import { useState } from 'react';
import type { CssPropertyAnalysis } from '../types/index.js';

interface Props {
  analysis: CssPropertyAnalysis;
}

export function PropertyCard({ analysis }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!analysis.modernCode) return;
    try {
      await navigator.clipboard.writeText(analysis.modernCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silent fail
    }
  };

  return (
    <article className="property-card">
      <header className="property-card__header">
        <code className="property-card__name">{analysis.property}</code>
        <code className="property-card__value">{analysis.value}</code>
        {analysis.isOutdated ? (
          <span className="badge badge--outdated" aria-label="Outdated property">Outdated</span>
        ) : (
          <span className="badge badge--modern" aria-label="Modern property">Modern</span>
        )}
      </header>

      <p className="property-card__explanation">{analysis.explanation}</p>

      {analysis.isOutdated && analysis.modernAlternative && (
        <div className="property-card__modern">
          <p className="property-card__modern-label">
            Modern alternative: <strong>{analysis.modernAlternative}</strong>
          </p>
          {analysis.modernCode && (
            <div className="property-card__code-block">
              <code className="property-card__code">{analysis.modernCode}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={handleCopy}
                aria-label={copied ? 'Copied!' : `Copy modern code: ${analysis.modernCode}`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
