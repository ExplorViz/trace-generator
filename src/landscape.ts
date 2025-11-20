import { FakeApp } from "./generation";

/**
 * Stores and manages the generated landscape (applications structure)
 */
export class LandscapeStore {
  private landscape: Array<FakeApp> | null = null;

  /**
   * Set the landscape
   */
  setLandscape(landscape: Array<FakeApp>): void {
    this.landscape = landscape;
  }

  /**
   * Get the current landscape
   */
  getLandscape(): Array<FakeApp> | null {
    return this.landscape;
  }

  /**
   * Check if a landscape exists
   */
  hasLandscape(): boolean {
    return this.landscape !== null;
  }

  /**
   * Clear the landscape
   */
  clearLandscape(): void {
    this.landscape = null;
  }
}
