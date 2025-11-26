import { LandscapeStore } from '../landscape';

/**
 * Shared singleton instance of LandscapeStore
 * This ensures all services use the same landscape instance
 */
export const sharedLandscapeStore = new LandscapeStore();
