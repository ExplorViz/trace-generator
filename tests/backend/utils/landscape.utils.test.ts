import { describe, expect, it } from 'vitest';
import { FakeApp, FakeClass, FakeMethod, FakePackage } from '../../../src/backend/shared/types';
import {
  cleanLandscapeForSerialization,
  reconstructParentReferences,
} from '../../../src/backend/utils/landscape.utils';

describe('cleanLandscapeForSerialization', () => {
  it('should clean a simple landscape', () => {
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

    const cleaned = cleanLandscapeForSerialization([app]);

    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].name).toBe('TestApp');
    expect(cleaned[0].rootPackage.name).toBe('com.example');
    expect(cleaned[0].classes).toHaveLength(1);
    expect(cleaned[0].classes[0].identifier).toBe('TestClass');
    expect(cleaned[0].entryPointFqn).toContain('TestClass');

    // Verify circular references are removed
    expect(cleaned[0].rootPackage.classes[0]).not.toHaveProperty('parent');
  });

  it('should handle nested packages', () => {
    const method: FakeMethod = { identifier: 'nestedMethod' };

    const subPackage: FakePackage = {
      name: 'subpackage',
      subpackages: [],
      classes: [],
    };

    const rootPackage: FakePackage = {
      name: 'com.example',
      subpackages: [subPackage],
      classes: [],
    };

    subPackage.parent = rootPackage;

    const testClass: FakeClass = {
      identifier: 'NestedClass',
      methods: [method],
      parentAppName: 'TestApp',
      parent: subPackage,
    };

    subPackage.classes = [testClass];

    const app: FakeApp = {
      name: 'TestApp',
      rootPackage,
      entryPoint: testClass,
      classes: [testClass],
      packages: [rootPackage, subPackage],
      methods: [method],
    };

    const cleaned = cleanLandscapeForSerialization([app]);

    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].rootPackage.subpackages).toHaveLength(1);
    expect(cleaned[0].rootPackage.subpackages[0].name).toBe('subpackage');
    expect(cleaned[0].rootPackage.subpackages[0].classes).toHaveLength(1);
    expect(cleaned[0].rootPackage.subpackages[0].classes[0].identifier).toBe('NestedClass');
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

    const cleaned = cleanLandscapeForSerialization([app1, app2]);

    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].name).toBe('App1');
    expect(cleaned[1].name).toBe('App2');
    expect(cleaned[0].classes[0].identifier).toBe('Class1');
    expect(cleaned[1].classes[0].identifier).toBe('Class2');
  });

  it('should handle classes with multiple methods', () => {
    const method1: FakeMethod = { identifier: 'method1' };
    const method2: FakeMethod = { identifier: 'method2' };
    const method3: FakeMethod = { identifier: 'method3' };

    const rootPackage: FakePackage = { name: 'com.test', subpackages: [], classes: [] };

    const testClass: FakeClass = {
      identifier: 'MultiMethodClass',
      methods: [method1, method2, method3],
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
      methods: [method1, method2, method3],
    };

    const cleaned = cleanLandscapeForSerialization([app]);

    expect(cleaned[0].classes[0].methods).toHaveLength(3);
    expect(cleaned[0].methods).toHaveLength(3);
  });
});

describe('reconstructParentReferences', () => {
  it('should reconstruct parent references for a simple landscape', () => {
    const cleanedData = [
      {
        name: 'TestApp',
        rootPackage: {
          name: 'com.example',
          classes: [
            {
              identifier: 'TestClass',
              methods: [{ identifier: 'testMethod' }],
              parentAppName: 'TestApp',
            },
          ],
          subpackages: [],
        },
        entryPointFqn: 'com.example.TestClass',
        classes: [
          {
            identifier: 'TestClass',
            methods: [{ identifier: 'testMethod' }],
            parentAppName: 'TestApp',
          },
        ],
        packages: [
          {
            name: 'com.example',
            classes: [
              {
                identifier: 'TestClass',
                methods: [{ identifier: 'testMethod' }],
                parentAppName: 'TestApp',
              },
            ],
            subpackages: [],
          },
        ],
        methods: [{ identifier: 'testMethod' }],
      },
    ];

    const reconstructed = reconstructParentReferences(cleanedData);

    expect(reconstructed).toHaveLength(1);
    expect(reconstructed[0].name).toBe('TestApp');
    expect(reconstructed[0].rootPackage.classes[0].parent).toBe(reconstructed[0].rootPackage);
    expect(reconstructed[0].entryPoint).toBeDefined();
    expect(reconstructed[0].entryPoint.identifier).toBe('TestClass');
  });

  it('should reconstruct nested package references', () => {
    const cleanedData = [
      {
        name: 'TestApp',
        rootPackage: {
          name: 'com.example',
          classes: [],
          subpackages: [
            {
              name: 'subpackage',
              classes: [
                {
                  identifier: 'NestedClass',
                  methods: [{ identifier: 'nestedMethod' }],
                  parentAppName: 'TestApp',
                },
              ],
              subpackages: [],
            },
          ],
        },
        entryPointFqn: 'com.example.subpackage.NestedClass',
        classes: [
          {
            identifier: 'NestedClass',
            methods: [{ identifier: 'nestedMethod' }],
            parentAppName: 'TestApp',
          },
        ],
        packages: [],
        methods: [{ identifier: 'nestedMethod' }],
      },
    ];

    const reconstructed = reconstructParentReferences(cleanedData);

    expect(reconstructed).toHaveLength(1);
    const rootPkg = reconstructed[0].rootPackage;
    const subPkg = rootPkg.subpackages[0];

    expect(subPkg.parent).toBe(rootPkg);
    expect(subPkg.classes[0].parent).toBe(subPkg);
    expect(reconstructed[0].entryPoint.identifier).toBe('NestedClass');
  });

  it('should handle entry point reconstruction when FQN matches', () => {
    const cleanedData = [
      {
        name: 'TestApp',
        rootPackage: {
          name: 'com.example',
          classes: [
            {
              identifier: 'FirstClass',
              methods: [],
              parentAppName: 'TestApp',
            },
            {
              identifier: 'SecondClass',
              methods: [],
              parentAppName: 'TestApp',
            },
          ],
          subpackages: [],
        },
        entryPointFqn: 'com.example.SecondClass',
        classes: [
          {
            identifier: 'FirstClass',
            methods: [],
            parentAppName: 'TestApp',
          },
          {
            identifier: 'SecondClass',
            methods: [],
            parentAppName: 'TestApp',
          },
        ],
        packages: [],
        methods: [],
      },
    ];

    const reconstructed = reconstructParentReferences(cleanedData);

    expect(reconstructed[0].entryPoint.identifier).toBe('SecondClass');
  });

  it('should fallback to first class if entryPoint FQN not found', () => {
    const cleanedData = [
      {
        name: 'TestApp',
        rootPackage: {
          name: 'com.example',
          classes: [
            {
              identifier: 'FirstClass',
              methods: [],
              parentAppName: 'TestApp',
            },
          ],
          subpackages: [],
        },
        entryPointFqn: 'com.example.NonExistentClass',
        classes: [
          {
            identifier: 'FirstClass',
            methods: [],
            parentAppName: 'TestApp',
          },
        ],
        packages: [],
        methods: [],
      },
    ];

    const reconstructed = reconstructParentReferences(cleanedData);

    expect(reconstructed[0].entryPoint.identifier).toBe('FirstClass');
  });

  it('should handle multiple apps', () => {
    const cleanedData = [
      {
        name: 'App1',
        rootPackage: {
          name: 'pkg1',
          classes: [{ identifier: 'Class1', methods: [], parentAppName: 'App1' }],
          subpackages: [],
        },
        entryPointFqn: 'pkg1.Class1',
        classes: [{ identifier: 'Class1', methods: [], parentAppName: 'App1' }],
        packages: [],
        methods: [],
      },
      {
        name: 'App2',
        rootPackage: {
          name: 'pkg2',
          classes: [{ identifier: 'Class2', methods: [], parentAppName: 'App2' }],
          subpackages: [],
        },
        entryPointFqn: 'pkg2.Class2',
        classes: [{ identifier: 'Class2', methods: [], parentAppName: 'App2' }],
        packages: [],
        methods: [],
      },
    ];

    const reconstructed = reconstructParentReferences(cleanedData);

    expect(reconstructed).toHaveLength(2);
    expect(reconstructed[0].name).toBe('App1');
    expect(reconstructed[1].name).toBe('App2');
    expect(reconstructed[0].entryPoint.identifier).toBe('Class1');
    expect(reconstructed[1].entryPoint.identifier).toBe('Class2');
  });
});
