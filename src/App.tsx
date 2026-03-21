import { Sun, Moon } from 'lucide-react';
import { CssInput } from './components/CssInput.js';
import { ResultsPanel } from './components/ResultsPanel.js';
import { LoadingSkeleton } from './components/LoadingSkeleton.js';
import { useCssExplainer } from './hooks/useCssExplainer.js';
import { useTheme } from './hooks/useTheme.js';

export default function App() {
  const { status, data, error, explain, reset } = useCssExplainer();
  const { theme, toggle } = useTheme();

  const handleNewAnalysis = () => {
    reset();
  };

  return (
    <>
      <a href="#results" className="skip-link">Skip to results</a>

      <div className="app-layout">
        <header className="app-header">
          <div className="app-header__inner">
            <div className="app-header__brand">
              <svg className="app-header__logo" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <text x="2" y="26" fontSize="28" fontFamily="monospace" fill="currentColor">{'{}'}</text>
              </svg>
              <div>
                <h1 className="app-header__title">CSS Explainer</h1>
                <p className="app-header__subtitle">Understand & modernize your CSS instantly</p>
              </div>
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            </button>
          </div>
        </header>

        <main className="app-main" id="main">
          <div className="app-main__inner">
            <section className="input-section" aria-label="CSS input">
              <CssInput onSubmit={explain} isLoading={status === 'loading'} />
            </section>

            {error && (
              <p className="error-message" role="alert">
                <strong>Error:</strong> {error}
              </p>
            )}

            <div id="results">
              {status === 'loading' && <LoadingSkeleton />}
              {status === 'success' && data && (
                <>
                  <ResultsPanel data={data} />
                  <div className="new-analysis">
                    <button type="button" className="btn btn--ghost" onClick={handleNewAnalysis}>
                      ← Analyze another snippet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>
            Powered by <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer">Claude</a> ·
          </p>
        </footer>
      </div>
    </>
  );
}
