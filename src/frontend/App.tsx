import { CleanedLandscape } from '../backend/shared/types';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from './api/client';
import { DarkModeToggle } from './components/DarkModeToggle';
import { LandscapeEditor } from './components/LandscapeEditor';
import { LandscapeFormResetHandle, LandscapeGenerationForm } from './components/LandscapeGenerationForm';
import { ResetButton } from './components/ResetButton';
import { TraceGenerationForm } from './components/TraceGenerationForm';

function App() {
  const [landscape, setLandscape] = useState<CleanedLandscape[]>([]);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const landscapeFormResetRef = useRef<LandscapeFormResetHandle>(null);

  useEffect(() => {
    loadLandscape();
  }, []);

  const loadLandscape = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getLandscape();
      setLandscape(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load landscape');
    } finally {
      setLoading(false);
    }
  };

  const handleLandscapeGenerated = (newLandscape: CleanedLandscape[]) => {
    setLandscape(newLandscape);
    setError(null);
    setSuccess('Landscape generated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLandscapeUpdated = (updatedLandscape: CleanedLandscape[]) => {
    setLandscape(updatedLandscape);
    setError(null);
  };

  return (
    <div className="min-h-screen text-primary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <DarkModeToggle />

        {/* Success toast notification - bottom right corner */}
        {success && (
          <div className="fixed bottom-8 right-4 z-40 p-4 bg-success-light text-success rounded-lg border border-success shadow-lg max-w-sm transition-all duration-300 ease-in-out">
            {success}
          </div>
        )}

        {/* Error message - inline at top of content */}
        {error && <div className="mb-6 p-4 bg-danger-light text-danger rounded-lg border border-danger">{error}</div>}

        <header className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4">Trace Generator</h1>
          <p className="text-lg text-muted">
            Generate OpenTelemetry traces for ExplorViz based on generated software landscapes.
          </p>
        </header>

        {/* Step 1: Landscape Generation */}
        <section id="section_landscape" className="mb-12">
          <div className="material-card p-6 md:p-8 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-3xl font-bold text-primary">Step 1: Generate Landscape</h2>
              <ResetButton onReset={() => landscapeFormResetRef.current?.reset()} />
            </div>
            <p className="text-muted mb-6">
              Generate a random landscape with applications, packages, classes, and methods.
            </p>
            <LandscapeGenerationForm
              onLandscapeGenerated={handleLandscapeGenerated}
              onError={setError}
              resetButtonRef={landscapeFormResetRef}
            />
          </div>
        </section>

        {/* Landscape Editor */}
        {landscape.length > 0 && (
          <section id="section_landscape_editor" className="mb-12">
            <div className="material-card p-6 md:p-8">
              <h2 className="text-3xl font-bold text-primary mb-3">Landscape Editor</h2>
              <p className="text-muted mb-6">
                Edit the landscape structure. You can add, rename, or delete entities (applications, packages, classes,
                and methods).
              </p>
              <LandscapeEditor landscape={landscape} onLandscapeUpdated={handleLandscapeUpdated} onError={setError} />
            </div>
          </section>
        )}

        {/* Divider */}
        {landscape.length > 0 && <div className="border-t border-muted my-12"></div>}

        {/* Step 2: Trace Generation */}
        {landscape.length > 0 && (
          <section id="section_traces">
            <div className="material-card p-6 md:p-8">
              <h2 className="text-3xl font-bold text-primary mb-3">Step 2: Generate Traces</h2>
              <p className="text-muted mb-6">Generate random traces based on the current landscape.</p>
              <TraceGenerationForm
                onError={(err) => {
                  setError(err);
                  setSuccess(null);
                }}
                onSuccess={(msg) => {
                  setSuccess(msg);
                  setError(null);
                  setTimeout(() => setSuccess(null), 3000);
                }}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
