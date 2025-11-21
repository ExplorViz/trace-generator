import { CleanedLandscape } from '@shared/types';
import { useEffect, useState } from 'react';
import { apiClient } from './api/client';
import { DarkModeToggle } from './components/DarkModeToggle';
import { LandscapeEditor } from './components/LandscapeEditor';
import { LandscapeGenerationForm } from './components/LandscapeGenerationForm';
import { TraceGenerationForm } from './components/TraceGenerationForm';

function App() {
  const [landscape, setLandscape] = useState<CleanedLandscape[]>([]);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <DarkModeToggle />

        <header className="mb-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">Trace Generator</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Generate OpenTelemetry traces for random application landscapes
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
            {success}
          </div>
        )}

        {/* Step 1: Landscape Generation */}
        <section id="section_landscape" className="mb-12">
          <div className="material-card p-6 md:p-8 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Step 1: Generate Landscape</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Generate a random landscape with applications, packages, classes, and methods.
            </p>
            <LandscapeGenerationForm onLandscapeGenerated={handleLandscapeGenerated} onError={setError} />
          </div>
        </section>

        {/* Landscape Editor */}
        {landscape.length > 0 && (
          <section id="section_landscape_editor" className="mb-12">
            <div className="material-card p-6 md:p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Landscape Editor</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Edit the landscape structure. You can add, rename, or delete entities (applications, packages, classes,
                and methods).
              </p>
              <LandscapeEditor landscape={landscape} onLandscapeUpdated={handleLandscapeUpdated} onError={setError} />
            </div>
          </section>
        )}

        {/* Divider */}
        {landscape.length > 0 && <div className="border-t border-gray-300 dark:border-gray-700 my-12"></div>}

        {/* Step 2: Trace Generation */}
        {landscape.length > 0 && (
          <section id="section_traces">
            <div className="material-card p-6 md:p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Step 2: Generate Traces</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Generate random traces based on the current landscape.
              </p>
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
