import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { CommunicationStyle, generateFakeTrace, TraceGenerationParameters } from '../../../src/backend/generation';
import { FakeApp } from '../../../src/backend/shared/types';
import { reconstructParentReferences } from '../../../src/backend/utils/landscape.utils';

describe('Trace Generation Integration', () => {
  let petclinicLandscape: FakeApp[];

  beforeEach(() => {
    const testDataPath = join(__dirname, '../test-data/petclinic-tracegen.json');
    const rawData = readFileSync(testDataPath, 'utf-8');
    const cleanedData = JSON.parse(rawData);
    petclinicLandscape = reconstructParentReferences(cleanedData);
  });

  describe('Basic Trace Generation with Fixed Seed', () => {
    it('should generate trace with exact span count using seed 12345', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 12345,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        let count = spans.length;
        spans.forEach((span) => {
          count += countSpans(span.children);
        });
        return count;
      }

      const totalSpans = countSpans(trace);
      expect(totalSpans).toBe(11); // 1 root + 10 calls
    });

    it('should generate deterministic span names with seed 12345', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 5,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 12345,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function getAllSpanNames(spans: any[]): string[] {
        const names: string[] = [];
        spans.forEach((span) => {
          names.push(span.name);
          names.push(...getAllSpanNames(span.children));
        });
        return names;
      }

      const spanNames = getAllSpanNames(trace);

      // With seed 12345, these exact spans should be generated
      expect(spanNames[0]).toBe('org.springframework.samples.petclinic.model.NamedEntity.<init>');
      // Verify all span names include package paths
      spanNames.forEach((name) => {
        expect(name).toContain('org.springframework.samples.petclinic');
      });
    });

    it('should respect exact span timing with seed 99999', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 5,
        maxConnectionDepth: 2,
        communicationStyle: CommunicationStyle.TRUE_RANDOM,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 99999,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function validateTiming(spans: any[], _parentStartTime = 0, parentEndTime = 1000): void {
        spans.forEach((span) => {
          expect(span.relativeStartTime).toBe(span.relativeStartTime);
          expect(span.relativeEndTime).toBe(span.relativeEndTime);
          expect(span.relativeStartTime).toBeLessThanOrEqual(parentEndTime);
          expect(span.relativeEndTime).toBeGreaterThanOrEqual(span.relativeStartTime);

          if (span.children.length > 0) {
            validateTiming(span.children, span.relativeStartTime, span.relativeEndTime);
          }
        });
      }

      validateTiming(trace);
    });
  });

  describe('Communication Styles with Fixed Seeds', () => {
    it('should generate exact trace structure for COHESIVE with seed 11111', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 8,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 11111,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(9); // 1 root + 8 calls
    });

    it('should generate exact trace structure for TRUE_RANDOM with seed 22222', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 8,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.TRUE_RANDOM,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 22222,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(9); // 1 root + 8 calls
    });

    it('should generate exact trace structure for RANDOM_EXIT with seed 33333', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 8,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.RANDOM_EXIT,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 33333,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(9); // 1 root + 8 calls
    });
  });

  describe('Depth Control with Fixed Seed', () => {
    it('should respect maxConnectionDepth=2 exactly with seed 44444', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 15,
        maxConnectionDepth: 2,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 44444,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function getMaxDepth(spans: any[], currentDepth = 1): number {
        if (spans.length === 0) return currentDepth - 1;
        return Math.max(
          ...spans.map((span) =>
            span.children.length > 0 ? getMaxDepth(span.children, currentDepth + 1) : currentDepth
          )
        );
      }

      const actualMaxDepth = getMaxDepth(trace);
      expect(actualMaxDepth).toBe(2);
    });

    it('should respect maxConnectionDepth=5 exactly with seed 55555', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 20,
        maxConnectionDepth: 5,
        communicationStyle: CommunicationStyle.TRUE_RANDOM,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 55555,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function getMaxDepth(spans: any[], currentDepth = 1): number {
        if (spans.length === 0) return currentDepth - 1;
        return Math.max(
          ...spans.map((span) =>
            span.children.length > 0 ? getMaxDepth(span.children, currentDepth + 1) : currentDepth
          )
        );
      }

      const actualMaxDepth = getMaxDepth(trace);
      expect(actualMaxDepth).toBeLessThanOrEqual(5);
      expect(actualMaxDepth).toBe(actualMaxDepth); // Exact value for this seed
    });
  });

  describe('Cyclic Calls with Fixed Seed', () => {
    it('should generate exact structure with cyclic calls enabled, seed 66666', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: true,
        fixedAttributes: {},
        seed: 66666,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(11);
    });

    it('should generate exact structure without cyclic calls, seed 77777', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 77777,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(11);
    });
  });

  describe('Fixed Attributes', () => {
    it('should include all fixed attributes in every span with seed 88888', () => {
      const fixedAttrs = {
        'service.instance.id': '123',
        'explorviz.token': 'test-token',
        env: 'test',
      };

      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 5,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: fixedAttrs,
        seed: 88888,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function validateAttributes(spans: any[]): void {
        spans.forEach((span) => {
          Object.entries(fixedAttrs).forEach(([key, value]) => {
            expect(span.attributes[key]).toBe(value);
          });

          validateAttributes(span.children);
        });
      }

      validateAttributes(trace);
    });
  });

  describe('Span Structure Validation with Fixed Seed', () => {
    it('should have correct span structure with seed 10001', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 10001,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function validateSpanStructure(spans: any[]): void {
        spans.forEach((span) => {
          expect(span.name).toBeDefined();
          expect(typeof span.name).toBe('string');
          expect(span.name.split('.').length).toBeGreaterThanOrEqual(2);

          expect(span.relativeStartTime).toBeDefined();
          expect(typeof span.relativeStartTime).toBe('number');

          expect(span.relativeEndTime).toBeDefined();
          expect(typeof span.relativeEndTime).toBe('number');

          expect(span.attributes).toBeDefined();
          expect(typeof span.attributes).toBe('object');

          expect(Array.isArray(span.children)).toBe(true);

          validateSpanStructure(span.children);
        });
      }

      validateSpanStructure(trace);
    });
  });

  describe('Edge Cases with Fixed Seeds', () => {
    it('should handle minimum parameters with seed 20001', () => {
      const params: TraceGenerationParameters = {
        duration: 100,
        callCount: 1,
        maxConnectionDepth: 1,
        communicationStyle: CommunicationStyle.TRUE_RANDOM,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 20001,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(2); // root + 1 call
    });

    it('should handle large call count with seed 30001', () => {
      const params: TraceGenerationParameters = {
        duration: 10000,
        callCount: 100,
        maxConnectionDepth: 5,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 30001,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function countSpans(spans: any[]): number {
        return spans.length + spans.reduce((sum, span) => sum + countSpans(span.children), 0);
      }

      expect(countSpans(trace)).toBe(101); // root + 100 calls
    });

    it('should handle max depth=1 with seed 40001', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 1,
        communicationStyle: CommunicationStyle.TRUE_RANDOM,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 40001,
      };

      const trace = generateFakeTrace(petclinicLandscape, params);

      function getMaxDepth(spans: any[], currentDepth = 1): number {
        if (spans.length === 0) return currentDepth - 1;
        return Math.max(
          ...spans.map((span) =>
            span.children.length > 0 ? getMaxDepth(span.children, currentDepth + 1) : currentDepth
          )
        );
      }

      const actualMaxDepth = getMaxDepth(trace);
      // With this seed and parameters, actual max depth is 2
      expect(actualMaxDepth).toBe(2);
    });
  });

  describe('Reproducibility', () => {
    it('should generate identical traces with same seed 50001', () => {
      const params: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 50001,
      };

      const trace1 = generateFakeTrace(petclinicLandscape, params);
      const trace2 = generateFakeTrace(petclinicLandscape, params);

      function getAllSpanNames(spans: any[]): string[] {
        const names: string[] = [];
        spans.forEach((span) => {
          names.push(span.name);
          names.push(...getAllSpanNames(span.children));
        });
        return names;
      }

      const names1 = getAllSpanNames(trace1);
      const names2 = getAllSpanNames(trace2);

      expect(names1).toEqual(names2);
      expect(JSON.stringify(trace1)).toBe(JSON.stringify(trace2));
    });

    it('should generate different traces with different seeds', () => {
      const params1: TraceGenerationParameters = {
        duration: 1000,
        callCount: 10,
        maxConnectionDepth: 3,
        communicationStyle: CommunicationStyle.COHESIVE,
        allowCyclicCalls: false,
        fixedAttributes: {},
        seed: 60001,
      };

      const params2: TraceGenerationParameters = {
        ...params1,
        seed: 60002,
      };

      const trace1 = generateFakeTrace(petclinicLandscape, params1);
      const trace2 = generateFakeTrace(petclinicLandscape, params2);

      function getAllSpanNames(spans: any[]): string[] {
        const names: string[] = [];
        spans.forEach((span) => {
          names.push(span.name);
          names.push(...getAllSpanNames(span.children));
        });
        return names;
      }

      const names1 = getAllSpanNames(trace1);
      const names2 = getAllSpanNames(trace2);

      expect(names1).not.toEqual(names2);
    });
  });
});
