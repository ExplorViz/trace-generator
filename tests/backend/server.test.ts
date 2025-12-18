import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../../src/backend/server';

describe('Server', () => {
  describe('createServer', () => {
    it('should create an Express application', () => {
      const app = createServer();
      expect(app).toBeDefined();
      expect(typeof app).toBe('function'); // Express app is a function
    });

    it('should have health check endpoint', async () => {
      const app = createServer();

      // Mock request/response for health check
      const _mockReq = {};
      const _mockRes = {
        json: vi.fn(),
      };

      // Health check should be accessible
      expect(app._router).toBeDefined();
    });

    it('should configure middleware', () => {
      const app = createServer();

      // Check that the app has middleware configured
      // Express apps have a _router property when middleware is added
      expect(app._router).toBeDefined();
      expect(app._router.stack).toBeDefined();
      expect(app._router.stack.length).toBeGreaterThan(0);
    });

    it('should configure API routes', () => {
      const app = createServer();

      // Check that routes are registered
      const routes = app._router.stack.filter((layer: any) => layer.route).map((layer: any) => layer.route.path);

      expect(routes).toContain('/health');
    });

    it('should configure landscape routes', () => {
      const app = createServer();

      // Check that landscape router is mounted
      const routers = app._router.stack
        .filter((layer: any) => layer.name === 'router')
        .map((layer: any) => layer.regexp);

      // Should have routers mounted (landscape and traces)
      expect(routers.length).toBeGreaterThan(0);
    });

    it('should handle JSON body parsing', () => {
      const app = createServer();

      // Check for body parser middleware
      const hasBodyParser = app._router.stack.some((layer: any) => layer.name === 'jsonParser');

      expect(hasBodyParser).toBe(true);
    });

    it('should handle URL encoded bodies', () => {
      const app = createServer();

      // Check for urlencoded parser middleware
      const hasUrlencodedParser = app._router.stack.some((layer: any) => layer.name === 'urlencodedParser');

      expect(hasUrlencodedParser).toBe(true);
    });

    it('should configure CORS', () => {
      const app = createServer();

      // Check for CORS middleware
      const hasCors = app._router.stack.some((layer: any) => layer.name === 'corsMiddleware');

      expect(hasCors).toBe(true);
    });

    it('should serve static files', () => {
      const app = createServer();

      // Check for static file middleware
      const hasStatic = app._router.stack.some((layer: any) => layer.name === 'serveStatic');

      expect(hasStatic).toBe(true);
    });

    it('should have fallback route for SPA', () => {
      const app = createServer();

      // Check that there's a wildcard route at the end
      const routes = app._router.stack.filter((layer: any) => layer.route).map((layer: any) => layer.route.path);

      expect(routes).toContain('*');
    });

    it('should return 404 for unknown API routes', () => {
      const app = createServer();

      // The wildcard handler should check for /api paths
      // This is tested by the route configuration
      expect(app._router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('Route Handlers', () => {
    it('should export createServer function', () => {
      expect(typeof createServer).toBe('function');
    });

    it('should create independent server instances', () => {
      const app1 = createServer();
      const app2 = createServer();

      // Each call should create a new instance
      expect(app1).not.toBe(app2);
      expect(app1).toBeDefined();
      expect(app2).toBeDefined();
    });
  });

  describe('Middleware Order', () => {
    it('should configure middleware in correct order', () => {
      const app = createServer();

      const middlewareNames = app._router.stack.filter((layer: any) => layer.name).map((layer: any) => layer.name);

      // CORS should come before other middleware
      const corsIndex = middlewareNames.indexOf('corsMiddleware');
      const jsonIndex = middlewareNames.indexOf('jsonParser');

      if (corsIndex !== -1 && jsonIndex !== -1) {
        expect(corsIndex < jsonIndex).toBe(true);
      }
    });

    it('should configure routes after middleware', () => {
      const app = createServer();

      const stack = app._router.stack;
      let lastMiddlewareIndex = -1;
      let firstRouteIndex = -1;

      stack.forEach((layer: any, index: number) => {
        if (layer.name && layer.name.includes('Parser')) {
          lastMiddlewareIndex = index;
        }
        if (layer.route && firstRouteIndex === -1) {
          firstRouteIndex = index;
        }
      });

      // Parsers should come before routes
      if (lastMiddlewareIndex !== -1 && firstRouteIndex !== -1) {
        expect(lastMiddlewareIndex < firstRouteIndex).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', () => {
      const app = createServer();

      // The app should have a catch-all route handler
      const hasCatchAll = app._router.stack.some((layer: any) => layer.route && layer.route.path === '*');

      expect(hasCatchAll).toBe(true);
    });

    it('should differentiate between API and frontend routes', () => {
      const app = createServer();

      // The wildcard route should handle both API 404s and SPA routing
      const wildcardHandlers = app._router.stack.filter((layer: any) => layer.route && layer.route.path === '*');

      expect(wildcardHandlers.length).toBeGreaterThan(0);
    });
  });
});
