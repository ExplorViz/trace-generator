import { CleanedLandscape, LandscapeGenerationRequest } from '@shared/types';
import { Info } from 'lucide-react';
import React, { useState } from 'react';
import { apiClient } from '../api/client';

interface LandscapeGenerationFormProps {
  onLandscapeGenerated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
}

export function LandscapeGenerationForm({ onLandscapeGenerated, onError }: LandscapeGenerationFormProps) {
  const [formData, setFormData] = useState<LandscapeGenerationRequest>({
    appCount: 1,
    packageDepth: 4,
    minClassCount: 5,
    maxClassCount: 20,
    minMethodCount: 1,
    maxMethodCount: 5,
    balance: 0.5,
  });
  const [loading, setLoading] = useState(false);

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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Number of apps
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-48">How many applications should be generated</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              value={formData.appCount}
              onChange={(e) => updateValue('appCount', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.appCount}</span>
          </div>
        </div>

        {/* Package Depth */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Package depth
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">How deep the package structure should go (up to 4 layers)</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.packageDepth}
              onChange={(e) => updateValue('packageDepth', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.packageDepth}</span>
          </div>
        </div>

        {/* Min Class Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Minimum class count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Minimum number of classes per app</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="200"
              value={formData.minClassCount}
              onChange={(e) => updateValue('minClassCount', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.minClassCount}</span>
          </div>
        </div>

        {/* Max Class Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Maximum class count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Maximum number of classes per app</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="200"
              value={formData.maxClassCount}
              onChange={(e) => updateValue('maxClassCount', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.maxClassCount}</span>
          </div>
        </div>

        {/* Min Method Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Minimum method count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Minimum number of methods per class</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.minMethodCount}
              onChange={(e) => updateValue('minMethodCount', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.minMethodCount}</span>
          </div>
        </div>

        {/* Max Method Count */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Maximum method count
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Maximum number of methods per class</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={formData.maxMethodCount}
              onChange={(e) => updateValue('maxMethodCount', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.maxMethodCount}</span>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Balance
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Tree balance (0 = unbalanced, 1 = balanced)</span>
            </div>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.balance}
              onChange={(e) => updateValue('balance', parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-semibold w-12 text-right">{formData.balance.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="material-button w-full md:w-auto flex items-center gap-2">
        Generate Landscape
      </button>
    </form>
  );
}
