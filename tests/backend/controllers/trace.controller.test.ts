import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { constants } from '../../../src/backend/constants';
import { TraceController } from '../../../src/backend/controllers/trace.controller';
import { TraceService } from '../../../src/backend/services/trace.service';
import { TraceGenerationRequest } from '../../../src/backend/shared/types';

// Mock TraceService
vi.mock('../../../src/backend/services/trace.service');

describe('TraceController', () => {
  let controller: TraceController;
  let mockService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;
  let sendMock: any;

  beforeEach(() => {
    // Setup mocks
    jsonMock = vi.fn();
    sendMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({
      json: jsonMock,
      send: sendMock,
    });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    } as Partial<Response>;

    mockRequest = {
      body: {},
    } as Partial<Request>;

    mockService = {
      parseTraceRequest: vi.fn(),
      generateAndExportTrace: vi.fn(),
    };

    controller = new TraceController(mockService as TraceService);
  });

  describe('generateTrace', () => {
    it('should generate trace with valid parameters', () => {
      const mockTraceRequest: TraceGenerationRequest = {
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

      mockRequest.body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: false,
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);
      mockService.generateAndExportTrace.mockReturnValue(undefined);

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(mockService.parseTraceRequest).toHaveBeenCalledWith(mockRequest.body, constants.COMMUNICATION_STYLE_NAMES);
      expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should handle custom attributes', () => {
      const mockTraceRequest: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {
          env: 'production',
          version: '1.0.0',
        },
      };

      mockRequest.body = {
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
        value_customAttribute2: '1.0.0',
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should return 400 on parsing error', () => {
      mockRequest.body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'invalid_style', // Invalid
        allowCyclicCalls: false,
      };

      mockService.parseTraceRequest.mockImplementation(() => {
        throw new Error('Unknown communication style invalid_style');
      });

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unknown communication style invalid_style' });
    });

    it('should return 400 when no landscape exists', () => {
      const mockTraceRequest: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);
      mockService.generateAndExportTrace.mockImplementation(() => {
        throw new Error('No landscape available. Please generate a landscape first.');
      });

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No landscape available. Please generate a landscape first.',
      });
    });

    it('should return 400 on validation error', () => {
      const mockTraceRequest: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 0, // Invalid
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        customAttributes: {},
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);
      mockService.generateAndExportTrace.mockImplementation(() => {
        throw new Error('Invalid duration: must be >= 1');
      });

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid duration: must be >= 1' });
    });

    it('should return 400 with default message on unknown error', () => {
      mockService.parseTraceRequest.mockImplementation(() => {
        throw 'Unknown error';
      });

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to generate trace' });
    });

    it('should handle allowCyclicCalls flag', () => {
      const mockTraceRequest: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: true,
        customAttributes: {},
      };

      mockRequest.body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: true,
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should handle visitAllMethods flag', () => {
      const mockTraceRequest: TraceGenerationRequest = {
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

      mockRequest.body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        visitAllMethods: true,
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should handle traceSeed parameter', () => {
      const mockTraceRequest: TraceGenerationRequest = {
        targetHostname: 'localhost',
        targetPort: 4317,
        duration: 1000,
        callCount: 10,
        maxCallDepth: 5,
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        traceSeed: 12345,
        customAttributes: {},
      };

      mockRequest.body = {
        targetHostname: 'localhost',
        targetPort: '4317',
        duration: '1000',
        callCount: '10',
        maxCallDepth: '5',
        communicationStyle: 'cohesive',
        allowCyclicCalls: false,
        traceSeed: '12345',
      };

      mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

      controller.generateTrace(mockRequest as Request, mockResponse as Response);

      expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('should handle different communication styles', () => {
      const styles = ['true_random', 'cohesive', 'random_exit'];

      styles.forEach((style) => {
        const mockTraceRequest: TraceGenerationRequest = {
          targetHostname: 'localhost',
          targetPort: 4317,
          duration: 1000,
          callCount: 10,
          maxCallDepth: 5,
          communicationStyle: style,
          allowCyclicCalls: false,
          customAttributes: {},
        };

        mockRequest.body = {
          targetHostname: 'localhost',
          targetPort: '4317',
          duration: '1000',
          callCount: '10',
          maxCallDepth: '5',
          communicationStyle: style,
          allowCyclicCalls: false,
        };

        mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

        controller.generateTrace(mockRequest as Request, mockResponse as Response);

        expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
        expect(statusMock).toHaveBeenCalledWith(204);
      });
    });

    it('should handle different target hostnames and ports', () => {
      const targets = [
        { hostname: 'localhost', port: 4317 },
        { hostname: '192.168.1.100', port: 8080 },
        { hostname: 'collector.example.com', port: 55681 },
      ];

      targets.forEach((target) => {
        const mockTraceRequest: TraceGenerationRequest = {
          targetHostname: target.hostname,
          targetPort: target.port,
          duration: 1000,
          callCount: 10,
          maxCallDepth: 5,
          communicationStyle: 'cohesive',
          allowCyclicCalls: false,
          customAttributes: {},
        };

        mockRequest.body = {
          targetHostname: target.hostname,
          targetPort: target.port.toString(),
          duration: '1000',
          callCount: '10',
          maxCallDepth: '5',
          communicationStyle: 'cohesive',
          allowCyclicCalls: false,
        };

        mockService.parseTraceRequest.mockReturnValue(mockTraceRequest);

        controller.generateTrace(mockRequest as Request, mockResponse as Response);

        expect(mockService.generateAndExportTrace).toHaveBeenCalledWith(mockTraceRequest);
      });
    });
  });
});
