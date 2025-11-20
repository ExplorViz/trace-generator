import { CleanedLandscape, LandscapeGenerationRequest, TraceGenerationRequest } from '@shared/types';

const API_BASE_URL = '/api';

export class ApiClient {
  /**
   * Get current landscape
   */
  async getLandscape(): Promise<CleanedLandscape[]> {
    const response = await fetch(`${API_BASE_URL}/landscape`);
    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch landscape: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Generate new landscape
   */
  async generateLandscape(params: LandscapeGenerationRequest): Promise<CleanedLandscape[]> {
    const response = await fetch(`${API_BASE_URL}/landscape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate landscape');
    }

    return response.json();
  }

  /**
   * Update landscape
   */
  async updateLandscape(landscape: CleanedLandscape[]): Promise<CleanedLandscape[]> {
    const response = await fetch(`${API_BASE_URL}/landscape`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(landscape),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update landscape');
    }

    return response.json();
  }

  /**
   * Generate and export trace
   */
  async generateTrace(params: TraceGenerationRequest): Promise<void> {
    // Convert customAttributes to key_customAttributeX format
    const body: any = {
      targetHostname: params.targetHostname,
      targetPort: params.targetPort,
      duration: params.duration,
      callCount: params.callCount,
      maxCallDepth: params.maxCallDepth,
      communicationStyle: params.communicationStyle,
      allowCyclicCalls: params.allowCyclicCalls,
      visitAllMethods: params.visitAllMethods,
      traceSeed: params.traceSeed,
    };

    let attrCounter = 1;
    for (const [key, value] of Object.entries(params.customAttributes)) {
      body[`key_customAttribute${attrCounter}`] = key;
      body[`value_customAttribute${attrCounter}`] = value;
      attrCounter++;
    }

    const response = await fetch(`${API_BASE_URL}/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate trace');
    }
  }
}

export const apiClient = new ApiClient();
