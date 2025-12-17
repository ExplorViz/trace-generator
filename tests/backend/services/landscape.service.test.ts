import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandscapeStore } from '../../../src/backend/landscape';
import { LandscapeService } from '../../../src/backend/services/landscape.service';
import {
  AppGenerationParameters,
  FakeApp,
  FakeClass,
  FakeMethod,
  FakePackage,
} from '../../../src/backend/shared/types';

// Mock the generation module
vi.mock('../../../src/backend/generation', () => ({
  generateFakeApps: vi.fn((params: AppGenerationParameters): FakeApp[] => {
    const method: FakeMethod = { identifier: 'mockMethod' };
    const rootPackage: FakePackage = {
      name: 'com.example',
      subpackages: [],
      classes: [],
    };

    const mockClass: FakeClass = {
      identifier: 'MockClass',
      methods: [method],
      parentAppName: 'MockApp',
      parent: rootPackage,
    };

    rootPackage.classes = [mockClass];

    const mockApp: FakeApp = {
      name: 'MockApp',
      rootPackage,
      entryPoint: mockClass,
      classes: [mockClass],
      packages: [rootPackage],
      methods: [method],
    };

    return [mockApp];
  }),
  getClassFqn: vi.fn((cls: FakeClass) => {
    if (!cls || !cls.identifier) return 'com.example.UnknownClass';
    return `com.example.${cls.identifier}`;
  }),
}));

describe('LandscapeService', () => {
  let landscapeService: LandscapeService;
  let landscapeStore: LandscapeStore;

  beforeEach(() => {
    landscapeStore = new LandscapeStore();
    landscapeService = new LandscapeService(landscapeStore);
  });

  describe('generateLandscape', () => {
    it('should generate a landscape with valid parameters', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 2,
        minClassCount: 1,
        maxClassCount: 5,
        minMethodCount: 1,
        maxMethodCount: 10,
        balance: 0.5,
      };

      const result = landscapeService.generateLandscape(params);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should store the generated landscape', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      landscapeService.generateLandscape(params);
      const stored = landscapeStore.getLandscape();

      expect(stored).not.toBeNull();
      expect(Array.isArray(stored)).toBe(true);
    });

    it('should throw error for invalid appCount', () => {
      const params: AppGenerationParameters = {
        appCount: 0,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid appCount');
    });

    it('should throw error for negative packageDepth', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: -1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid packageDepth');
    });

    it('should throw error for invalid minClassCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 0,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid minClassCount');
    });

    it('should throw error for invalid maxClassCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 0,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid maxClassCount');
    });

    it('should throw error when maxClassCount < minClassCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 5,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('maxClassCount must be >= minClassCount');
    });

    it('should throw error for invalid minMethodCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 0,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid minMethodCount');
    });

    it('should throw error for invalid maxMethodCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 0,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('Invalid maxMethodCount');
    });

    it('should throw error when maxMethodCount < minMethodCount', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 10,
        maxMethodCount: 5,
        balance: 0.5,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('maxMethodCount must be >= minMethodCount');
    });

    it('should throw error for balance < 0', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: -0.1,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('balance must be between 0 and 1');
    });

    it('should throw error for balance > 1', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 1.1,
      };

      expect(() => landscapeService.generateLandscape(params)).toThrow('balance must be between 0 and 1');
    });

    it('should accept valid edge cases', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 0,
        minClassCount: 1,
        maxClassCount: 1,
        minMethodCount: 1,
        maxMethodCount: 1,
        balance: 0,
      };

      expect(() => landscapeService.generateLandscape(params)).not.toThrow();
    });

    it('should accept balance = 1', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 1,
      };

      expect(() => landscapeService.generateLandscape(params)).not.toThrow();
    });

    it('should accept optional seed parameter', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
        seed: 12345,
      };

      expect(() => landscapeService.generateLandscape(params)).not.toThrow();
    });
  });

  describe('getLandscape', () => {
    it('should return null when no landscape exists', () => {
      const result = landscapeService.getLandscape();
      expect(result).toBeNull();
    });

    it('should return cleaned landscape when it exists', () => {
      const params: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 1,
        minClassCount: 1,
        maxClassCount: 3,
        minMethodCount: 1,
        maxMethodCount: 5,
        balance: 0.5,
      };

      landscapeService.generateLandscape(params);
      const result = landscapeService.getLandscape();

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateLandscape', () => {
    it('should update the landscape with valid data', () => {
      const landscapeData = [
        {
          name: 'TestApp',
          rootPackage: {
            name: 'com.test',
            classes: [
              {
                identifier: 'TestClass',
                methods: [{ identifier: 'testMethod' }],
                parentAppName: 'TestApp',
              },
            ],
            subpackages: [],
          },
          entryPointFqn: 'com.test.TestClass',
          classes: [
            {
              identifier: 'TestClass',
              methods: [{ identifier: 'testMethod' }],
              parentAppName: 'TestApp',
            },
          ],
          packages: [],
          methods: [{ identifier: 'testMethod' }],
        },
      ];

      const result = landscapeService.updateLandscape(landscapeData);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('TestApp');
    });

    it('should throw error for non-array input', () => {
      expect(() => landscapeService.updateLandscape({} as any)).toThrow('Landscape must be an array');
    });

    it('should throw error for null input', () => {
      expect(() => landscapeService.updateLandscape(null as any)).toThrow('Landscape must be an array');
    });

    it('should throw error for undefined input', () => {
      expect(() => landscapeService.updateLandscape(undefined as any)).toThrow('Landscape must be an array');
    });

    it('should store the updated landscape', () => {
      const landscapeData = [
        {
          name: 'UpdatedApp',
          rootPackage: {
            name: 'com.updated',
            classes: [],
            subpackages: [],
          },
          entryPointFqn: 'com.updated.UpdatedClass',
          classes: [],
          packages: [],
          methods: [],
        },
      ];

      landscapeService.updateLandscape(landscapeData);
      const stored = landscapeStore.getLandscape();

      expect(stored).not.toBeNull();
      expect(stored![0].name).toBe('UpdatedApp');
    });
  });

  describe('parseGenerationRequest', () => {
    it('should parse valid request body', () => {
      const body = {
        appCount: '2',
        packageDepth: '3',
        minClassCount: '5',
        maxClassCount: '10',
        minMethodCount: '2',
        maxMethodCount: '8',
        balance: '0.75',
      };

      const result = landscapeService.parseGenerationRequest(body);

      expect(result.appCount).toBe(2);
      expect(result.packageDepth).toBe(3);
      expect(result.minClassCount).toBe(5);
      expect(result.maxClassCount).toBe(10);
      expect(result.minMethodCount).toBe(2);
      expect(result.maxMethodCount).toBe(8);
      expect(result.balance).toBe(0.75);
      expect(result.seed).toBeUndefined();
    });

    it('should parse request with seed', () => {
      const body = {
        appCount: '1',
        packageDepth: '1',
        minClassCount: '1',
        maxClassCount: '3',
        minMethodCount: '1',
        maxMethodCount: '5',
        balance: '0.5',
        landscapeSeed: '12345',
      };

      const result = landscapeService.parseGenerationRequest(body);

      expect(result.seed).toBe(12345);
    });

    it('should handle seed as undefined when not provided', () => {
      const body = {
        appCount: '1',
        packageDepth: '1',
        minClassCount: '1',
        maxClassCount: '3',
        minMethodCount: '1',
        maxMethodCount: '5',
        balance: '0.5',
      };

      const result = landscapeService.parseGenerationRequest(body);

      expect(result.seed).toBeUndefined();
    });

    it('should handle seed as undefined when invalid', () => {
      const body = {
        appCount: '1',
        packageDepth: '1',
        minClassCount: '1',
        maxClassCount: '3',
        minMethodCount: '1',
        maxMethodCount: '5',
        balance: '0.5',
        landscapeSeed: 'not-a-number',
      };

      const result = landscapeService.parseGenerationRequest(body);

      expect(result.seed).toBeUndefined();
    });

    it('should parse numeric values correctly', () => {
      const body = {
        appCount: 5,
        packageDepth: 2,
        minClassCount: 10,
        maxClassCount: 20,
        minMethodCount: 3,
        maxMethodCount: 15,
        balance: 0.8,
      };

      const result = landscapeService.parseGenerationRequest(body);

      expect(result.appCount).toBe(5);
      expect(result.balance).toBe(0.8);
    });
  });
});
