import { FakeApp, AppGenerationParameters } from "@shared/types";
import { generateFakeApps } from "../../generation";
import { LandscapeStore } from "../../landscape";
import { constants } from "../../constants";
import { isValidInteger } from "../../utils";
import {
  cleanLandscapeForSerialization,
  reconstructParentReferences,
  CleanedLandscape,
} from "../utils/landscape.utils";

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
  updateLandscape(landscapeData: any[]): CleanedLandscape[] {
    if (!Array.isArray(landscapeData)) {
      throw new Error("Landscape must be an array");
    }
    const landscape = reconstructParentReferences(landscapeData);
    this.landscapeStore.setLandscape(landscape);
    return cleanLandscapeForSerialization(landscape);
  }

  /**
   * Validate landscape generation parameters
   */
  private validateGenerationParameters(params: AppGenerationParameters): void {
    if (params.appCount < 1 || params.appCount > constants.MAX_APP_COUNT) {
      throw new Error("Invalid appCount");
    }
    if (
      params.packageDepth < 0 ||
      params.packageDepth > constants.MAX_PACKAGE_DEPTH
    ) {
      throw new Error("Invalid packageDepth");
    }
    if (
      params.minClassCount < 1 ||
      params.minClassCount > constants.MAX_CLASS_COUNT
    ) {
      throw new Error("Invalid minClassCount");
    }
    if (
      params.maxClassCount < 1 ||
      params.maxClassCount > constants.MAX_CLASS_COUNT
    ) {
      throw new Error("Invalid maxClassCount");
    }
    if (params.maxClassCount < params.minClassCount) {
      throw new Error("maxClassCount must be >= minClassCount");
    }
    if (
      params.minMethodCount < 1 ||
      params.minMethodCount > constants.MAX_METHODS
    ) {
      throw new Error("Invalid minMethodCount");
    }
    if (
      params.maxMethodCount < 1 ||
      params.maxMethodCount > constants.MAX_METHODS
    ) {
      throw new Error("Invalid maxMethodCount");
    }
    if (params.maxMethodCount < params.minMethodCount) {
      throw new Error("maxMethodCount must be >= minMethodCount");
    }
    if (params.balance < 0 || params.balance > 1) {
      throw new Error("balance must be between 0 and 1");
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
        body.appSeed !== undefined && isValidInteger(String(body.appSeed))
          ? parseInt(body.appSeed)
          : undefined,
    };
  }
}
