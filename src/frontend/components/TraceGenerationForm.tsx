import { TraceGenerationRequest } from '../../backend/shared/types';
import { Info, Plus, Send, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { ResetButton } from './ResetButton';

interface TraceGenerationFormProps {
  onError: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface CustomAttribute {
  id: number;
  key: string;
  value: string;
}

const DEFAULT_CUSTOM_ATTRIBUTES: Omit<CustomAttribute, 'id'>[] = [
  { key: 'explorviz.token.id', value: 'mytokenvalue' },
  { key: 'explorviz.token.secret', value: 'mytokensecret' },
  { key: 'telemetry.sdk.language', value: 'java' },
  { key: 'service.instance.id', value: '0' },
];

export function TraceGenerationForm({ onError, onSuccess }: TraceGenerationFormProps) {
  const [formData, setFormData] = useState<Omit<TraceGenerationRequest, 'customAttributes'>>({
    targetHostname: 'localhost',
    targetPort: 55678,
    duration: 1000,
    callCount: 50,
    maxCallDepth: 10,
    communicationStyle: 'true_random',
    allowCyclicCalls: false,
    visitAllMethods: false,
  });
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(() =>
    DEFAULT_CUSTOM_ATTRIBUTES.map((attr, idx) => ({ ...attr, id: idx + 1 }))
  );
  const [nextAttrId, setNextAttrId] = useState(DEFAULT_CUSTOM_ATTRIBUTES.length + 1);
  const [loading, setLoading] = useState(false);

  const updateValue = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string, isNumber: boolean = true) => {
    if (isNumber) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        updateValue(field as keyof typeof formData, numValue as any);
      }
    } else {
      updateValue(field as keyof typeof formData, value as any);
    }
  };

  const addCustomAttribute = () => {
    setCustomAttributes((prev) => [...prev, { id: nextAttrId, key: '', value: '' }]);
    setNextAttrId((prev) => prev + 1);
  };

  const removeCustomAttribute = (id: number) => {
    setCustomAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };

  const updateCustomAttribute = (id: number, field: 'key' | 'value', value: string) => {
    setCustomAttributes((prev) => prev.map((attr) => (attr.id === id ? { ...attr, [field]: value } : attr)));
  };

  const resetCustomAttributes = () => {
    if (confirm('Reset all custom attributes to default values? This will remove all current attributes.')) {
      const reset = DEFAULT_CUSTOM_ATTRIBUTES.map((attr, idx) => ({
        ...attr,
        id: idx + 1,
      }));
      setCustomAttributes(reset);
      setNextAttrId(DEFAULT_CUSTOM_ATTRIBUTES.length + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customAttrs: Record<string, string> = {};
      customAttributes.forEach((attr) => {
        if (attr.key.trim() && attr.value.trim()) {
          customAttrs[attr.key.trim()] = attr.value.trim();
        }
      });

      const request: TraceGenerationRequest = {
        ...formData,
        customAttributes: customAttrs,
      };

      await apiClient.generateTrace(request);
      onSuccess?.('Trace generated and sent successfully!');
    } catch (err: any) {
      onError(err.message || 'Failed to generate trace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* OpenTelemetry Collector Settings */}
      <div>
        <h3 className="text-xl font-bold text-primary mb-4">OpenTelemetry Collector Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Target hostname
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-64">Hostname of the OpenTelemetry Collector</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.targetHostname}
              onChange={(e) => updateValue('targetHostname', e.target.value)}
              pattern="[a-zA-Z0-9\.\-]+"
              required
              className="material-input w-full"
              placeholder="localhost"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Target port
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-64">Port of the OpenTelemetry Collector</span>
              </div>
            </label>
            <input
              type="number"
              min="0"
              max="65535"
              step="1"
              value={formData.targetPort}
              onChange={(e) => updateValue('targetPort', parseInt(e.target.value))}
              required
              className="material-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Trace Generation Settings */}
      <div>
        <h3 className="text-xl font-bold text-primary mb-4">Trace Generation Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Duration (ms)
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-64">How long the trace should last (calls evenly distributed)</span>
              </div>
            </label>
            <div className="range-slider-container">
              <input
                type="range"
                min="100"
                max="10000"
                value={Math.min(formData.duration, 10000)}
                onChange={(e) => updateValue('duration', parseInt(e.target.value))}
              />
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="material-input text-center"
                min="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Method Call Count
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-64">Number of method calls in the trace</span>
              </div>
            </label>
            <div className="range-slider-container">
              <input
                type="range"
                min="1"
                max="250"
                value={Math.min(formData.callCount, 250)}
                onChange={(e) => updateValue('callCount', parseInt(e.target.value))}
              />
              <input
                type="number"
                value={formData.callCount}
                onChange={(e) => handleInputChange('callCount', e.target.value)}
                className="material-input text-center"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Max Call Depth
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-64">Maximum nesting depth of method calls</span>
              </div>
            </label>
            <div className="range-slider-container">
              <input
                type="range"
                min="1"
                max="100"
                value={Math.min(formData.maxCallDepth, 100)}
                onChange={(e) => updateValue('maxCallDepth', parseInt(e.target.value))}
              />
              <input
                type="number"
                value={formData.maxCallDepth}
                onChange={(e) => handleInputChange('maxCallDepth', e.target.value)}
                className="material-input text-center"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-primary">
              Communication Style
              <div className="group relative">
                <span className="info-icon">
                  <Info className="w-4 h-4" />
                </span>
                <span className="tooltip w-80">
                  True Random: Random class selection
                  <br />
                  Cohesive: Stay within packages
                  <br />
                  Random Exit: Mostly within packages, sometimes exit
                </span>
              </div>
            </label>
            <select
              value={formData.communicationStyle}
              onChange={(e) => updateValue('communicationStyle', e.target.value)}
              required
              className="material-input w-full"
            >
              <option value="true_random">True Random</option>
              <option value="cohesive">Cohesive</option>
              <option value="random_exit">Random Exit</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowCyclicCalls}
              onChange={(e) => updateValue('allowCyclicCalls', e.target.checked)}
              className="w-5 h-5 rounded border-muted bg-light text-primary-color focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm font-medium text-primary">Allow cyclic calls</span>
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-64">Allow loops and recursive calls in the trace</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.visitAllMethods}
              onChange={(e) => updateValue('visitAllMethods', e.target.checked)}
              className="w-5 h-5 rounded border-muted bg-light text-primary-color focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm font-medium text-primary">Visit all methods</span>
            <div className="group relative">
              <span className="info-icon">
                <Info className="w-4 h-4" />
              </span>
              <span className="tooltip w-80">
                Visit every method in the landscape at least once. Call count will be adjusted automatically.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Custom Span Attributes */}
      <div>
        <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          Custom Span Attributes
          <div className="group relative">
            <span className="info-icon">
              <Info className="w-4 h-4" />
            </span>
            <span className="tooltip w-64">Fixed attributes included with every generated span</span>
          </div>
        </h3>
        <div className="space-y-3">
          {customAttributes.map((attr) => (
            <div key={attr.id} className="flex items-center gap-3">
              <input
                type="text"
                value={attr.key}
                onChange={(e) => updateCustomAttribute(attr.id, 'key', e.target.value)}
                placeholder="Attribute key"
                pattern="[a-zA-Z0-9\.\-]+"
                className="material-input min-w-[200px] flex-1 max-w-md"
              />
              <span className="text-muted font-semibold">:</span>
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateCustomAttribute(attr.id, 'value', e.target.value)}
                placeholder="Attribute value"
                pattern="[a-zA-Z0-9\.\-]+"
                className="material-input min-w-[200px] flex-1"
              />
              <button
                type="button"
                onClick={() => removeCustomAttribute(attr.id)}
                className="action-btn action-btn-delete flex-shrink-0"
                title="Remove attribute"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-3 justify-between items-center">
          <button
            type="button"
            onClick={addCustomAttribute}
            className="material-button-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Attribute
          </button>
          <ResetButton onReset={resetCustomAttributes} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="material-button w-full md:w-auto flex items-center gap-2">
        <Send className="w-5 h-5" />
        Generate and Send Trace
      </button>
    </form>
  );
}
