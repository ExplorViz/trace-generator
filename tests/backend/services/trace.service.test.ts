import { beforeEach, describe, expect, it, vi } from 'vitest';
import { constants } from '../../../src/backend/constants';
import { LandscapeStore } from '../../../src/backend/landscape';
import { TraceService } from '../../../src/backend/services/trace.service';
import { FakeApp, FakeClass, FakeMethod, FakePackage, TraceGenerationRequest } from '../../../src/backend/shared/types';
import { FakeTrace, FakeTraceExporter } from '../../../src/backend/tracing';

// Mock the tracing module
vi.mock('../../../src/backend/tracing', () => {
  class MockFakeTraceExporter {
    setUrl = vi.fn();
    writeTrace = vi.fn();
    shutdown = vi.fn();

    constructor(hostname: string, port: number) {
      // Mock constructor - do nothing
    }
  }

  return {
    FakeTraceExporter: MockFakeTraceExporter,
  };
});

// Mock the generation module
vi.mock('../../../src/backend/generation', () => ({
  CommunicationStyle: {
    TRUE_RANDOM: 'TRUE_RANDOM',
    COHESIVE: 'COHESIVE',
    RANDOM_EXIT: 'RANDOM_EXIT',
  },
  generateFakeTrace: vi.fn(
    (landscape: FakeApp[], params: any): FakeTrace => [
      {
        name: 'mockSpan',
        relativeStartTime: 0,
        relativeEndTime: 100,
        children: [],
      },
    ]
  ),
}));

// Mock utils
vi.mock('../../../src/backend/utils', () => ({
  getHostname: vi.fn(() => 'test-host'),
  getHostIP: vi.fn(() => '192.168.1.1'),
  isValidInteger: vi.fn((str: string) => {
    const num = parseInt(str, 10);
    return !isNaN(num) && Number.isInteger(num) && str === num.toString();
  }),
}));

describe('TraceService', () => {
  let traceService: TraceService;
  let landscapeStore: LandscapeStore;
  let traceExporter: FakeTraceExporter;

  beforeEach(() => {
    landscapeStore = new LandscapeStore();
    traceExporter = new FakeTraceExporter('localhost', 4317);
    traceService = new TraceService(landscapeStore, traceExporter);

    // Setup a mock landscape
    const method: FakeMethod = { identifier: 'testMethod' };
    const rootPackage: FakePackage = {
      name: 'com.example',
      subpackages: [],
      classes: [],
    };

    const testClass: FakeClass = {
      identifier: 'TestClass',
      methods: [method],
      parentAppName: 'TestApp',
      parent: rootPackage,
    };

    rootPackage.classes = [testClass];

    const app: FakeApp = {
      name: 'TestApp',
      rootPackage,
      entryPoint: testClass,
      classes: [testClass],
      packages: [rootPackage],
      methods: [method],
    };

    landscapeStore.setLandscape([app]);
  });

  describe('generateAndExportTrace', () => {
    it('should generate and export trace with valid parameters', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: false,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).not.toThrow();
      expect(traceExporter.setUrl).toHaveBeenCalledWith('localhost', 4317);
      expect(traceExporter.writeTrace).toHaveBeenCalled();
    });

    it('should throw error when no landscape exists', () => {
      const emptyStore = new LandscapeStore();
      const service = new TraceService(emptyStore, traceExporter);

      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      expect(() => service.generateAndExportTrace(request)).toThrow('No landscape available');
    });

    it('should throw error for invalid duration', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 0,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).toThrow('Invalid duration');
    });

    it('should throw error for invalid callCount', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 0,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).toThrow('Invalid callCount');
    });

    it('should throw error for invalid maxCallDepth', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 0,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).toThrow('Invalid maxConnectionDepth');
    });

    it('should throw error for unknown communication style', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'unknown_style',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).toThrow('Unknown communication style');
    });

    it('should include custom attributes', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {
          env: 'test',
          version: '1.0.0',
        },
      };

      expect(() => traceService.generateAndExportTrace(request)).not.toThrow();
    });

    it('should handle visitAllMethods flag', () => {
      const request: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: true,
        customAttributes: {},
      };

      expect(() => traceService.generateAndExportTrace(request)).not.toThrow();
    });
  });

  describe('parseTraceRequest', () => {
    it('should parse valid request body', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: false,
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.targetHostname).toBe('localhost');
      expect(result.targetPort).toBe(4317);
      expect(result.duration).toBe(1000);
      expect(result.callCount).toBe(10);
      expect(result.maxCallDepth).toBe(5);
      expect(result.communicationStyle).toBe('cohesive');
      expect(result.allowCyclicCalls).toBe(false);
      expect(result.visitAllMethods).toBe(false);
    });

    it('should parse allowCyclicCalls as boolean', () => {
      const body1 = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: true,
      };

      const result1 = traceService.parseTraceRequest(body1, constants.COMMUNICATION_STYLE_NAMES);
      expect(result1.allowCyclicCalls).toBe(true);

      const body2 = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: 'on',
      };

      const result2 = traceService.parseTraceRequest(body2, constants.COMMUNICATION_STYLE_NAMES);
      expect(result2.allowCyclicCalls).toBe(true);
    });

    it('should parse visitAllMethods as boolean', () => {
      const body1 = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: true,
      };

      const result1 = traceService.parseTraceRequest(body1, constants.COMMUNICATION_STYLE_NAMES);
      expect(result1.visitAllMethods).toBe(true);

      const body2 = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: 'on',
      };

      const result2 = traceService.parseTraceRequest(body2, constants.COMMUNICATION_STYLE_NAMES);
      expect(result2.visitAllMethods).toBe(true);
    });

    it('should throw error for unknown communication style', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'invalid_style',
        allowCyclicCalls: false,
      };

      expect(() => traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES)).toThrow(
        'Unknown communication style'
      );
    });

    it('should parse custom attributes', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        key_customAttribute1: 'env',
        value_customAttribute1: 'production',
        key_customAttribute2: 'version',
        value_customAttribute2: '2.0.0',
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.customAttributes).toEqual({
        env: 'production',
        version: '2.0.0',
      });
    });

    it('should handle missing custom attributes', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.customAttributes).toEqual({});
    });

    it('should skip invalid custom attributes', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        key_customAttribute1: 'valid',
        value_customAttribute1: 'value',
        key_customAttribute2: 123, // Invalid: not a string
        value_customAttribute2: 'value',
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.customAttributes).toEqual({
        valid: 'value',
      });
    });

    it('should parse traceSeed when valid', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        traceSeed: '12345',
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.traceSeed).toBe(12345);
    });

    it('should handle traceSeed as undefined when invalid', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        traceSeed: 'not-a-number',
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.traceSeed).toBeUndefined();
    });

    it('should handle traceSeed as undefined when not provided', () => {
      const body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
      };

      const result = traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES);

      expect(result.traceSeed).toBeUndefined();
    });

    it('should handle all communication style types', () => {
      const styles = ['true_random', 'cohesive', 'random_exit'];

      styles.forEach((style) => {
        const body = {
          targetHostname: 'localhost',
          targetPort: '4317',
          duration: '1000',
          callCount: '10',
          maxCallDepth: '5',
          communicationStyle: style,
          allowCyclicCalls: false,
        };

        expect(() => traceService.parseTraceRequest(body, constants.COMMUNICATION_STYLE_NAMES)).not.toThrow();
      });
    });
  });
});
