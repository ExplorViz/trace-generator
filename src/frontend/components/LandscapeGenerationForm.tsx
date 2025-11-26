import { CleanedLandscape, LandscapeGenerationRequest } from '../../backend/shared/types';
import { Info } from 'lucide-react';
import React, { useState } from 'react';
import { apiClient } from '../api/client';

export interface LandscapeFormResetHandle {
  reset: () => void;
}

interface LandscapeGenerationFormProps {
  onLandscapeGenerated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
  resetButtonRef?: React.RefObject<LandscapeFormResetHandle>;
}

const DEFAULT_FORM_DATA: LandscapeGenerationRequest = {
  appCount: 1,
  packageDepth: 4,
  minClassCount: 5,
  maxClassCount: 20,
  minMethodCount: 1,
  maxMethodCount: 5,
  balance: 0.5,
};

export function LandscapeGenerationForm({
  onLandscapeGenerated,
  onError,
  resetButtonRef,
}: LandscapeGenerationFormProps) {
  const [formData, setFormData] = useState<LandscapeGenerationRequest>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);

  const resetToDefaults = () => {
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const landscape = await apiClient.generateLandscape(formData);
      onLandscapeGenerated(landscape);
    } catch (err: any) {
      onError(err.message || 'Failed to generate landscape');
    } finally {
      setLoading(false);
    }
  };

  const updateValue = (field: keyof LandscapeGenerationRequest, value: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-adjust paired min/max values when using slider
      if (field === 'minClassCount' && value > prev.maxClassCount) {
        updated.maxClassCount = value;
      }
      if (field === 'maxClassCount' && value < prev.minClassCount) {
        updated.minClassCount = value;
      }
      if (field === 'minMethodCount' && value > prev.maxMethodCount) {
        updated.maxMethodCount = value;
      }
      if (field === 'maxMethodCount' && value < prev.minMethodCount) {
        updated.minMethodCount = value;
      }
      return updated;
    });
  };

  const handleInputChange = (field: keyof LandscapeGenerationRequest, value: string, isFloat: boolean = false) => {
    const numValue = isFloat ? parseFloat(value) : parseInt(value, 10);
    if (!isNaN(numValue)) {
      // Auto-adjust paired min/max values
      if (field === 'minClassCount' && numValue > formData.maxClassCount) {
        updateValue('maxClassCount', numValue);
      }
      if (field === 'maxClassCount' && numValue < formData.minClassCount) {
        updateValue('minClassCount', numValue);
      }
      if (field === 'minMethodCount' && numValue > formData.maxMethodCount) {
        updateValue('maxMethodCount', numValue);
      }
      if (field === 'maxMethodCount' && numValue < formData.minMethodCount) {
        updateValue('minMethodCount', numValue);
      }
      updateValue(field, numValue);
    }
  };

  // Expose reset function via ref if provided
  React.useImperativeHandle(
    resetButtonRef,
    () => ({
      reset: resetToDefaults,
    }),
    []
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Number of apps
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-48">How many applications should be generated</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="50"
              value={Math.min(formData.appCount, 50)}
              onChange={(e) => updateValue('appCount', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.appCount}
              onChange={(e) => handleInputChange('appCount', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Package Depth */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Package depth
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">How deep the package structure should go (up to 4 layers)</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="100"
              value={Math.min(formData.packageDepth, 100)}
              onChange={(e) => updateValue('packageDepth', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.packageDepth}
              onChange={(e) => handleInputChange('packageDepth', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Min Class Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Minimum class count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Minimum number of classes per app</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="200"
              value={formData.minClassCount}
              onChange={(e) => updateValue('minClassCount', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.minClassCount}
              onChange={(e) => handleInputChange('minClassCount', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Max Class Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Maximum class count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Maximum number of classes per app</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="200"
              value={formData.maxClassCount}
              onChange={(e) => updateValue('maxClassCount', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.maxClassCount}
              onChange={(e) => handleInputChange('maxClassCount', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Min Method Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Minimum method count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Minimum number of methods per class</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.minMethodCount}
              onChange={(e) => updateValue('minMethodCount', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.minMethodCount}
              onChange={(e) => handleInputChange('minMethodCount', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Max Method Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Maximum method count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Maximum number of methods per class</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.maxMethodCount}
              onChange={(e) => updateValue('maxMethodCount', parseInt(e.target.value))}
            />
            <input
              type="number"
              value={formData.maxMethodCount}
              onChange={(e) => handleInputChange('maxMethodCount', e.target.value)}
              className="material-input text-center"
              min="1"
            />
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-primary">
            Balance
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Tree balance (0 = unbalanced, 1 = balanced)</span>
            </div>
          </label>
          <div className="range-slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.balance}
              onChange={(e) => updateValue('balance', parseFloat(e.target.value))}
            />
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => handleInputChange('balance', e.target.value, true)}
              step="0.1"
              className="material-input text-center"
            />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="material-button w-full md:w-auto flex items-center gap-2">
        Generate Landscape
      </button>
    </form>
  );
}
