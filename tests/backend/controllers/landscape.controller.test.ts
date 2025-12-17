import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandscapeController } from '../../../src/backend/controllers/landscape.controller';
import { LandscapeService } from '../../../src/backend/services/landscape.service';
import { AppGenerationParameters } from '../../../src/backend/shared/types';

// Mock LandscapeService
vi.mock('../../../src/backend/services/landscape.service');

describe('LandscapeController', () => {
  let controller: LandscapeController;
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
      getLandscape: vi.fn(),
      generateLandscape: vi.fn(),
      updateLandscape: vi.fn(),
      parseGenerationRequest: vi.fn(),
    };

    controller = new LandscapeController(mockService as LandscapeService);
  });

  describe('getLandscape', () => {
    it('should return 404 when no landscape exists', () => {
      mockService.getLandscape.mockReturnValue(null);

      controller.getLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLandscape).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No landscape has been generated yet' });
    });

    it('should return 200 with landscape when it exists', () => {
      const mockLandscape = [
        {
          name: 'TestApp',
          rootPackage: { name: 'com.test', classes: [], subpackages: [] },
          entryPointFqn: 'com.test.TestClass',
          classes: [],
          packages: [],
          methods: [],
        },
      ];

      mockService.getLandscape.mockReturnValue(mockLandscape);

      controller.getLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.getLandscape).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockLandscape);
    });

    it('should return 500 on service error', () => {
      mockService.getLandscape.mockImplementation(() => {
        throw new Error('Service error');
      });

      controller.getLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Service error' });
    });

    it('should return 500 with default message on unknown error', () => {
      mockService.getLandscape.mockImplementation(() => {
        throw 'Unknown error';
      });

      controller.getLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('generateLandscape', () => {
    it('should generate landscape with valid parameters', () => {
      const mockParams: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 2,
        minClassCount: 1,
        maxClassCount: 5,
        minMethodCount: 1,
        maxMethodCount: 10,
        balance: 0.5,
      };

      const mockLandscape = [
        {
          name: 'GeneratedApp',
          rootPackage: { name: 'com.generated', classes: [], subpackages: [] },
          entryPointFqn: 'com.generated.GeneratedClass',
          classes: [],
          packages: [],
          methods: [],
        },
      ];

      mockRequest.body = {
        appCount: '1',
        packageDepth: '2',
        minClassCount: '1',
        maxClassCount: '5',
        minMethodCount: '1',
        maxMethodCount: '10',
        balance: '0.5',
      };

      mockService.parseGenerationRequest.mockReturnValue(mockParams);
      mockService.generateLandscape.mockReturnValue(mockLandscape);

      controller.generateLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.parseGenerationRequest).toHaveBeenCalledWith(mockRequest.body);
      expect(mockService.generateLandscape).toHaveBeenCalledWith(mockParams);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockLandscape);
    });

    it('should return 400 on validation error', () => {
      mockRequest.body = {
        appCount: '0', // Invalid
      };

      mockService.parseGenerationRequest.mockImplementation(() => {
        throw new Error('Invalid appCount: must be >= 1');
      });

      controller.generateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid appCount: must be >= 1' });
    });

    it('should return 400 on generation error', () => {
      const mockParams: AppGenerationParameters = {
        appCount: 1,
        packageDepth: 2,
        minClassCount: 5,
        maxClassCount: 3, // Invalid: max < min
        minMethodCount: 1,
        maxMethodCount: 10,
        balance: 0.5,
      };

      mockService.parseGenerationRequest.mockReturnValue(mockParams);
      mockService.generateLandscape.mockImplementation(() => {
        throw new Error('maxClassCount must be >= minClassCount');
      });

      controller.generateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'maxClassCount must be >= minClassCount' });
    });

    it('should return 400 with default message on unknown error', () => {
      mockService.parseGenerationRequest.mockImplementation(() => {
        throw 'Unknown error';
      });

      controller.generateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to generate landscape' });
    });
  });

  describe('updateLandscape', () => {
    it('should update landscape with valid data', () => {
      const landscapeData = [
        {
          name: 'UpdatedApp',
          rootPackage: { name: 'com.updated', classes: [], subpackages: [] },
          entryPointFqn: 'com.updated.UpdatedClass',
          classes: [],
          packages: [],
          methods: [],
        },
      ];

      mockRequest.body = landscapeData;
      mockService.updateLandscape.mockReturnValue(landscapeData);

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLandscape).toHaveBeenCalledWith(landscapeData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(landscapeData);
    });

    it('should return 400 on validation error', () => {
      mockRequest.body = { invalid: 'data' }; // Not an array

      mockService.updateLandscape.mockImplementation(() => {
        throw new Error('Landscape must be an array');
      });

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Landscape must be an array' });
    });

    it('should return 400 on update error', () => {
      mockRequest.body = [];

      mockService.updateLandscape.mockImplementation(() => {
        throw new Error('Update failed');
      });

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Update failed' });
    });

    it('should return 400 with default message on unknown error', () => {
      mockRequest.body = [];

      mockService.updateLandscape.mockImplementation(() => {
        throw 'Unknown error';
      });

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to update landscape' });
    });

    it('should handle empty array', () => {
      mockRequest.body = [];
      mockService.updateLandscape.mockReturnValue([]);

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLandscape).toHaveBeenCalledWith([]);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it('should handle multiple apps in landscape', () => {
      const landscapeData = [
        {
          name: 'App1',
          rootPackage: { name: 'com.app1', classes: [], subpackages: [] },
          entryPointFqn: 'com.app1.App1Class',
          classes: [],
          packages: [],
          methods: [],
        },
        {
          name: 'App2',
          rootPackage: { name: 'com.app2', classes: [], subpackages: [] },
          entryPointFqn: 'com.app2.App2Class',
          classes: [],
          packages: [],
          methods: [],
        },
      ];

      mockRequest.body = landscapeData;
      mockService.updateLandscape.mockReturnValue(landscapeData);

      controller.updateLandscape(mockRequest as Request, mockResponse as Response);

      expect(mockService.updateLandscape).toHaveBeenCalledWith(landscapeData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(landscapeData);
    });
  });
});
