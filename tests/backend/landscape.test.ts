import { beforeEach, describe, expect, it } from 'vitest';
import { LandscapeStore } from '../../src/backend/landscape';
import { FakeApp, FakeClass, FakeMethod, FakePackage } from '../../src/backend/shared/types';

describe('LandscapeStore', () => {
  let landscapeStore: LandscapeStore;

  beforeEach(() => {
    landscapeStore = new LandscapeStore();
  });

  describe('initial state', () => {
    it('should initialize with null landscape', () => {
      expect(landscapeStore.getLandscape()).toBeNull();
    });

    it('should report no landscape on initialization', () => {
      expect(landscapeStore.hasLandscape()).toBe(false);
    });
  });

  describe('setLandscape', () => {
    it('should store a landscape', () => {
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

      expect(landscapeStore.getLandscape()).not.toBeNull();
      expect(landscapeStore.getLandscape()).toHaveLength(1);
    });

    it('should replace existing landscape', () => {
      const method1: FakeMethod = { identifier: 'method1' };
      const pkg1: FakePackage = { name: 'pkg1', subpackages: [], classes: [] };
      const class1: FakeClass = {
        identifier: 'Class1',
        methods: [method1],
        parentAppName: 'App1',
        parent: pkg1,
      };
      pkg1.classes = [class1];
      const app1: FakeApp = {
        name: 'App1',
        rootPackage: pkg1,
        entryPoint: class1,
        classes: [class1],
        packages: [pkg1],
        methods: [method1],
      };

      landscapeStore.setLandscape([app1]);
      expect(landscapeStore.getLandscape()![0].name).toBe('App1');

      const method2: FakeMethod = { identifier: 'method2' };
      const pkg2: FakePackage = { name: 'pkg2', subpackages: [], classes: [] };
      const class2: FakeClass = {
        identifier: 'Class2',
        methods: [method2],
        parentAppName: 'App2',
        parent: pkg2,
      };
      pkg2.classes = [class2];
      const app2: FakeApp = {
        name: 'App2',
        rootPackage: pkg2,
        entryPoint: class2,
        classes: [class2],
        packages: [pkg2],
        methods: [method2],
      };

      landscapeStore.setLandscape([app2]);
      expect(landscapeStore.getLandscape()![0].name).toBe('App2');
      expect(landscapeStore.getLandscape()).toHaveLength(1);
    });

    it('should handle empty landscape array', () => {
      landscapeStore.setLandscape([]);
      expect(landscapeStore.getLandscape()).toEqual([]);
      expect(landscapeStore.hasLandscape()).toBe(true);
    });

    it('should handle multiple apps', () => {
      const method1: FakeMethod = { identifier: 'method1' };
      const method2: FakeMethod = { identifier: 'method2' };

      const pkg1: FakePackage = { name: 'pkg1', subpackages: [], classes: [] };
      const pkg2: FakePackage = { name: 'pkg2', subpackages: [], classes: [] };

      const class1: FakeClass = {
        identifier: 'Class1',
        methods: [method1],
        parentAppName: 'App1',
        parent: pkg1,
      };

      const class2: FakeClass = {
        identifier: 'Class2',
        methods: [method2],
        parentAppName: 'App2',
        parent: pkg2,
      };

      pkg1.classes = [class1];
      pkg2.classes = [class2];

      const app1: FakeApp = {
        name: 'App1',
        rootPackage: pkg1,
        entryPoint: class1,
        classes: [class1],
        packages: [pkg1],
        methods: [method1],
      };

      const app2: FakeApp = {
        name: 'App2',
        rootPackage: pkg2,
        entryPoint: class2,
        classes: [class2],
        packages: [pkg2],
        methods: [method2],
      };

      landscapeStore.setLandscape([app1, app2]);

      expect(landscapeStore.getLandscape()).toHaveLength(2);
      expect(landscapeStore.getLandscape()![0].name).toBe('App1');
      expect(landscapeStore.getLandscape()![1].name).toBe('App2');
    });
  });

  describe('getLandscape', () => {
    it('should return null when no landscape is set', () => {
      expect(landscapeStore.getLandscape()).toBeNull();
    });

    it('should return the stored landscape', () => {
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

      const retrieved = landscapeStore.getLandscape();
      expect(retrieved).not.toBeNull();
      expect(retrieved![0].name).toBe('TestApp');
      expect(retrieved![0].classes[0].identifier).toBe('TestClass');
    });

    it('should return the same reference', () => {
      const method: FakeMethod = { identifier: 'testMethod' };
      const pkg: FakePackage = { name: 'pkg', subpackages: [], classes: [] };
      const cls: FakeClass = {
        identifier: 'Class',
        methods: [method],
        parentAppName: 'App',
        parent: pkg,
      };
      pkg.classes = [cls];
      const app: FakeApp = {
        name: 'App',
        rootPackage: pkg,
        entryPoint: cls,
        classes: [cls],
        packages: [pkg],
        methods: [method],
      };

      landscapeStore.setLandscape([app]);

      const ref1 = landscapeStore.getLandscape();
      const ref2 = landscapeStore.getLandscape();

      expect(ref1).toBe(ref2);
    });
  });

  describe('hasLandscape', () => {
    it('should return false when no landscape is set', () => {
      expect(landscapeStore.hasLandscape()).toBe(false);
    });

    it('should return true when landscape is set', () => {
      const method: FakeMethod = { identifier: 'testMethod' };
      const pkg: FakePackage = { name: 'pkg', subpackages: [], classes: [] };
      const cls: FakeClass = {
        identifier: 'Class',
        methods: [method],
        parentAppName: 'App',
        parent: pkg,
      };
      pkg.classes = [cls];
      const app: FakeApp = {
        name: 'App',
        rootPackage: pkg,
        entryPoint: cls,
        classes: [cls],
        packages: [pkg],
        methods: [method],
      };

      landscapeStore.setLandscape([app]);

      expect(landscapeStore.hasLandscape()).toBe(true);
    });

    it('should return true even for empty landscape array', () => {
      landscapeStore.setLandscape([]);
      expect(landscapeStore.hasLandscape()).toBe(true);
    });

    it('should return false after clearing', () => {
      const method: FakeMethod = { identifier: 'testMethod' };
      const pkg: FakePackage = { name: 'pkg', subpackages: [], classes: [] };
      const cls: FakeClass = {
        identifier: 'Class',
        methods: [method],
        parentAppName: 'App',
        parent: pkg,
      };
      pkg.classes = [cls];
      const app: FakeApp = {
        name: 'App',
        rootPackage: pkg,
        entryPoint: cls,
        classes: [cls],
        packages: [pkg],
        methods: [method],
      };

      landscapeStore.setLandscape([app]);
      expect(landscapeStore.hasLandscape()).toBe(true);

      landscapeStore.clearLandscape();
      expect(landscapeStore.hasLandscape()).toBe(false);
    });
  });

  describe('clearLandscape', () => {
    it('should clear the stored landscape', () => {
      const method: FakeMethod = { identifier: 'testMethod' };
      const pkg: FakePackage = { name: 'pkg', subpackages: [], classes: [] };
      const cls: FakeClass = {
        identifier: 'Class',
        methods: [method],
        parentAppName: 'App',
        parent: pkg,
      };
      pkg.classes = [cls];
      const app: FakeApp = {
        name: 'App',
        rootPackage: pkg,
        entryPoint: cls,
        classes: [cls],
        packages: [pkg],
        methods: [method],
      };

      landscapeStore.setLandscape([app]);
      expect(landscapeStore.getLandscape()).not.toBeNull();

      landscapeStore.clearLandscape();
      expect(landscapeStore.getLandscape()).toBeNull();
    });

    it('should be idempotent', () => {
      landscapeStore.clearLandscape();
      expect(landscapeStore.getLandscape()).toBeNull();

      landscapeStore.clearLandscape();
      expect(landscapeStore.getLandscape()).toBeNull();
    });

    it('should allow setting landscape again after clearing', () => {
      const method: FakeMethod = { identifier: 'testMethod' };
      const pkg: FakePackage = { name: 'pkg', subpackages: [], classes: [] };
      const cls: FakeClass = {
        identifier: 'Class',
        methods: [method],
        parentAppName: 'App',
        parent: pkg,
      };
      pkg.classes = [cls];
      const app: FakeApp = {
        name: 'App',
        rootPackage: pkg,
        entryPoint: cls,
        classes: [cls],
        packages: [pkg],
        methods: [method],
      };

      landscapeStore.setLandscape([app]);
      landscapeStore.clearLandscape();
      landscapeStore.setLandscape([app]);

      expect(landscapeStore.getLandscape()).not.toBeNull();
      expect(landscapeStore.hasLandscape()).toBe(true);
    });
  });
});
