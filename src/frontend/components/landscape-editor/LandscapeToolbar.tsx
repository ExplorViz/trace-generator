import { ChevronsDown, ChevronsUp, FileUp, Plus, Save } from 'lucide-react';
import { LandscapeToolbarProps } from './types';

export function LandscapeToolbar({
  onAddApp,
  onExpandAll,
  onCollapseAll,
  onSaveLandscape,
  onLoadLandscape,
  onLoadPreset,
  availablePresets = [],
  isLoadingPresets = false,
}: LandscapeToolbarProps) {
  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = event.target.value;
    if (presetName && onLoadPreset) {
      onLoadPreset(presetName);
      // Reset select to default
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button type="button" onClick={onAddApp} className="material-button-secondary px-4 py-2 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add App
      </button>
      <button
        type="button"
        onClick={onExpandAll}
        className="material-button-secondary px-4 py-2 flex items-center gap-2"
      >
        <ChevronsDown className="w-4 h-4" />
        Expand All
      </button>
      <button
        type="button"
        onClick={onCollapseAll}
        className="material-button-secondary px-4 py-2 flex items-center gap-2"
      >
        <ChevronsUp className="w-4 h-4" />
        Collapse All
      </button>
      {onLoadPreset && (
        <div className="relative inline-block">
          {' '}
          <select
            onChange={handlePresetChange}
            disabled={isLoadingPresets || availablePresets.length === 0}
            className="w-48 h-12 material-button-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
            defaultValue=""
            aria-label="Load preset landscape"
          >
            <option value="" disabled>
              {isLoadingPresets
                ? 'Loading presets...'
                : availablePresets.length === 0
                  ? 'No presets available'
                  : 'Load Preset'}
            </option>
            {availablePresets.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="material-button-secondary px-4 py-2 flex items-center gap-2 cursor-pointer">
        <FileUp className="w-4 h-4" />
        Load Landscape
        <input
          type="file"
          accept=".json,application/json"
          onChange={onLoadLandscape}
          className="hidden"
          aria-label="Load landscape from file"
        />
      </label>
      <button type="button" onClick={onSaveLandscape} className="material-button px-4 py-2 flex items-center gap-2">
        <Save className="w-4 h-4" />
        Save Landscape
      </button>
    </div>
  );
}
