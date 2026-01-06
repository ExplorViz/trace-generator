import { generateFakeApps } from '../generation';
import { LandscapeStore } from '../landscape';
import { AppGenerationParameters } from '../shared/types';
import { isValidInteger } from '../utils';
import { convertStructureLandscapeToRegular, isStructureLandscape } from '../utils/landscape-structure-converter';
import {
  CleanedLandscape,
  cleanLandscapeForSerialization,
  reconstructParentReferences,
} from '../utils/landscape.utils';

export class LandscapeService {
  private landscapeStore: LandscapeStore;

  constructor(landscapeStore: LandscapeStore) {
    this.landscapeStore = landscapeStore;
  }

  /**
   * Generate a new landscape based on parameters
   */
  generateLandscape(params: AppGenerationParameters): CleanedLandscape[] {
    this.validateGenerationParameters(params);
    const apps = generateFakeApps(params);
    this.landscapeStore.setLandscape(apps);
    return cleanLandscapeForSerialization(apps);
  }

  /**
   * Get the current landscape
   */
  getLandscape(): CleanedLandscape[] | null {
    const landscape = this.landscapeStore.getLandscape();
    if (landscape === null) {
      return null;
    }
    return cleanLandscapeForSerialization(landscape);
  }

  /**
   * Update the landscape
   */
  updateLandscape(landscapeData: any): CleanedLandscape[] {
    // Check if this is a structure landscape format
    if (isStructureLandscape(landscapeData)) {
      // Convert structure format to regular format
      const convertedLandscape = convertStructureLandscapeToRegular(landscapeData);
      const landscape = reconstructParentReferences(convertedLandscape);
      this.landscapeStore.setLandscape(landscape);
      return cleanLandscapeForSerialization(landscape);
    }

    // Regular landscape format (array of CleanedLandscape)
    if (!Array.isArray(landscapeData)) {
      throw new Error('Landscape must be an array or structure landscape format');
    }
    const landscape = reconstructParentReferences(landscapeData);
    this.landscapeStore.setLandscape(landscape);
    return cleanLandscapeForSerialization(landscape);
  }

  /**
   * Validate landscape generation parameters
   */
  private validateGenerationParameters(params: AppGenerationParameters): void {
    if (params.appCount < 1) {
      throw new Error('Invalid appCount: must be >= 1');
    }
    if (params.packageDepth < 0) {
      throw new Error('Invalid packageDepth: must be >= 0');
    }
    if (params.minClassCount < 1) {
      throw new Error('Invalid minClassCount: must be >= 1');
    }
    if (params.maxClassCount < 1) {
      throw new Error('Invalid maxClassCount: must be >= 1');
    }
    if (params.maxClassCount < params.minClassCount) {
      throw new Error('maxClassCount must be >= minClassCount');
    }
    if (params.minMethodCount < 1) {
      throw new Error('Invalid minMethodCount: must be >= 1');
    }
    if (params.maxMethodCount < 1) {
      throw new Error('Invalid maxMethodCount: must be >= 1');
    }
    if (params.maxMethodCount < params.minMethodCount) {
      throw new Error('maxMethodCount must be >= minMethodCount');
    }
    if (params.balance < 0 || params.balance > 1) {
      throw new Error('balance must be between 0 and 1');
    }
  }

  /**
   * Parse request body into AppGenerationParameters
   */
  parseGenerationRequest(body: any): AppGenerationParameters {
    return {
      appCount: parseInt(body.appCount),
      packageDepth: parseInt(body.packageDepth),
      minClassCount: parseInt(body.minClassCount),
      maxClassCount: parseInt(body.maxClassCount),
      minMethodCount: parseInt(body.minMethodCount),
      maxMethodCount: parseInt(body.maxMethodCount),
      balance: parseFloat(body.balance),
      seed:
        body.landscapeSeed !== undefined && isValidInteger(String(body.landscapeSeed))
          ? parseInt(body.landscapeSeed)
          : undefined,
    };
  }
}
