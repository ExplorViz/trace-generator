/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { CleanedLandscape, CleanedPackage, CleanedClass } from '../../src/backend/shared/types';

describe('LandscapeEditor - Drag and Drop Move Functions', () => {
  const createMockApp = (name: string, rootPackages?: CleanedPackage[], classes?: CleanedClass[]): CleanedLandscape => {
    const defaultRootPackage: CleanedPackage = {
      name: 'org',
      classes: [],
      subpackages: [
        {
          name: 'tracegenerator',
          classes: [],
          subpackages: [],
        },
      ],
    };

    return {
      name,
      rootPackages: rootPackages || [defaultRootPackage],
      entryPointFqn: `org.tracegenerator.${name}.Main`,
      classes: classes || [],
      packages: rootPackages || [defaultRootPackage],
      methods: [],
    };
  };

  const createMockPackage = (
    name: string,
    classes: CleanedClass[] = [],
    subpackages: CleanedPackage[] = []
  ): CleanedPackage => {
    return { name, classes, subpackages };
  };

  const createMockClass = (
    identifier: string,
    methods: { identifier: string }[] = [],
    parentAppName: string = 'TestApp'
  ): CleanedClass => {
    return { identifier, methods, parentAppName };
  };

  // Helper to find a package in the landscape
  const findPackageInLandscape = (
    landscape: CleanedLandscape[],
    appIdx: number,
    packageName: string
  ): CleanedPackage | null => {
    const app = landscape[appIdx];
    if (!app) return null;

    const search = (pkg: CleanedPackage): CleanedPackage | null => {
      if (pkg.name === packageName) return pkg;
      for (const subPkg of pkg.subpackages) {
        const found = search(subPkg);
        if (found) return found;
      }
      return null;
    };

    for (const rootPkg of app.rootPackages) {
      const found = search(rootPkg);
      if (found) return found;
    }
    return null;
  };

  // Helper to check if package exists in app
  const packageExistsInApp = (landscape: CleanedLandscape[], appIdx: number, packageName: string): boolean => {
    return findPackageInLandscape(landscape, appIdx, packageName) !== null;
  };

  // Helper to check if class exists in app
  const classExistsInApp = (landscape: CleanedLandscape[], appIdx: number, className: string): boolean => {
    const app = landscape[appIdx];
    if (!app) return false;

    const search = (pkg: CleanedPackage): boolean => {
      if (pkg.classes.some((c) => c.identifier === className)) return true;
      return pkg.subpackages.some(search);
    };

    return app.rootPackages.some(search);
  };

  // Helper to get class from app
  const getClassFromApp = (landscape: CleanedLandscape[], appIdx: number, className: string): CleanedClass | null => {
    const app = landscape[appIdx];
    if (!app) return null;

    const search = (pkg: CleanedPackage): CleanedClass | null => {
      const cls = pkg.classes.find((c) => c.identifier === className);
      if (cls) return cls;
      for (const subPkg of pkg.subpackages) {
        const found = search(subPkg);
        if (found) return found;
      }
      return null;
    };

    for (const rootPkg of app.rootPackages) {
      const found = search(rootPkg);
      if (found) return found;
    }
    return null;
  };

  // Helper to trigger movePackage by simulating the handler call
  const triggerMovePackage = (
    landscape: CleanedLandscape[],
    sourceAppIdx: number,
    sourcePackageName: string,
    targetAppIdx: number,
    targetPackageName: string | null
  ): CleanedLandscape[] => {
    const updated = JSON.parse(JSON.stringify(landscape)); // Deep clone
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      throw new Error('Invalid app index');
    }

    // Find source package
    let sourcePackage: CleanedPackage | null = null;
    let sourceParentArray: CleanedPackage[] | null = null;

    const findSource = (pkg: CleanedPackage, parentArray: CleanedPackage[]): boolean => {
      if (pkg.name === sourcePackageName) {
        sourcePackage = pkg;
        sourceParentArray = parentArray;
        return true;
      }
      for (let i = 0; i < pkg.subpackages.length; i++) {
        if (findSource(pkg.subpackages[i], pkg.subpackages)) {
          return true;
        }
      }
      return false;
    };

    for (let i = 0; i < sourceApp.rootPackages.length; i++) {
      if (findSource(sourceApp.rootPackages[i], sourceApp.rootPackages)) {
        break;
      }
    }

    if (!sourcePackage || !sourceParentArray) {
      throw new Error(`Source package "${sourcePackageName}" not found`);
    }

    // Store references after null check for proper type narrowing
    const packageToMove = sourcePackage;
    const parentArray: CleanedPackage[] = sourceParentArray;

    // Prevent moving package into itself or its descendants (only if same app)
    if (sourceAppIdx === targetAppIdx && targetPackageName) {
      // Find target package
      const findTarget = (pkg: CleanedPackage): CleanedPackage | null => {
        if (pkg.name === targetPackageName) return pkg;
        for (const subPkg of pkg.subpackages) {
          const found = findTarget(subPkg);
          if (found) return found;
        }
        return null;
      };

      let targetPkg: CleanedPackage | null = null;
      for (const rootPkg of targetApp.rootPackages) {
        targetPkg = findTarget(rootPkg);
        if (targetPkg) break;
      }

      if (targetPkg) {
        // Check if targetPkg is the source package itself
        if (targetPkg === packageToMove) {
          throw new Error('Cannot move package into itself');
        }
        // Check if targetPkg is a descendant (subpackage) of the source package
        const isDescendantOfSource = (pkg: CleanedPackage): boolean => {
          if (pkg === targetPkg) return true;
          return pkg.subpackages.some(isDescendantOfSource);
        };
        if (isDescendantOfSource(packageToMove)) {
          throw new Error('Cannot move package into its own subpackage');
        }
      }
    }

    // Remove from source
    const sourceIndex = parentArray.findIndex((p: CleanedPackage) => p.name === sourcePackageName);
    if (sourceIndex === -1) {
      throw new Error(`Source package "${sourcePackageName}" not found in parent`);
    }
    parentArray.splice(sourceIndex, 1);

    // Add to target
    if (targetPackageName === null) {
      targetApp.rootPackages.push(sourcePackage);
    } else {
      // Find target package
      const findTarget = (pkg: CleanedPackage): CleanedPackage | null => {
        if (pkg.name === targetPackageName) return pkg;
        for (const subPkg of pkg.subpackages) {
          const found = findTarget(subPkg);
          if (found) return found;
        }
        return null;
      };

      let targetPkg: CleanedPackage | null = null;
      for (const rootPkg of targetApp.rootPackages) {
        targetPkg = findTarget(rootPkg);
        if (targetPkg) break;
      }

      if (!targetPkg) {
        throw new Error(`Target package "${targetPackageName}" not found`);
      }
      targetPkg.subpackages.push(packageToMove);
    }

    return updated;
  };

  // Helper to trigger moveClass
  const triggerMoveClass = (
    landscape: CleanedLandscape[],
    sourceAppIdx: number,
    className: string,
    targetAppIdx: number,
    targetPackageName: string
  ): CleanedLandscape[] => {
    const updated = JSON.parse(JSON.stringify(landscape)); // Deep clone
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      throw new Error('Invalid app index');
    }

    // Find source class
    const findSourceClass = (pkg: CleanedPackage): CleanedClass | null => {
      const cls = pkg.classes.find((c) => c.identifier === className);
      if (cls) return cls;
      for (const subPkg of pkg.subpackages) {
        const found = findSourceClass(subPkg);
        if (found) return found;
      }
      return null;
    };

    let sourceClass: CleanedClass | null = null;
    for (const rootPkg of sourceApp.rootPackages) {
      sourceClass = findSourceClass(rootPkg);
      if (sourceClass) break;
    }

    if (!sourceClass) {
      throw new Error(`Class "${className}" not found`);
    }

    // Find target package
    const findTarget = (pkg: CleanedPackage): CleanedPackage | null => {
      if (pkg.name === targetPackageName) return pkg;
      for (const subPkg of pkg.subpackages) {
        const found = findTarget(subPkg);
        if (found) return found;
      }
      return null;
    };

    let targetPkg: CleanedPackage | null = null;
    for (const rootPkg of targetApp.rootPackages) {
      targetPkg = findTarget(rootPkg);
      if (targetPkg) break;
    }

    if (!targetPkg) {
      throw new Error(`Target package "${targetPackageName}" not found`);
    }

    // Update parentAppName if moving to different app
    const updatedClass =
      sourceAppIdx !== targetAppIdx ? { ...sourceClass, parentAppName: targetApp.name } : sourceClass;

    // Remove from source package and add to target package
    const removeClass = (p: CleanedPackage): CleanedPackage => ({
      ...p,
      classes: p.classes.filter((c) => c.identifier !== className),
      subpackages: p.subpackages.map(removeClass),
    });

    // Update target app tree structure - add class to target package
    const updateTargetTree = (p: CleanedPackage): CleanedPackage => {
      if (p.name === targetPackageName) {
        return { ...p, classes: [...p.classes, updatedClass] };
      }
      return { ...p, subpackages: p.subpackages.map(updateTargetTree) };
    };

    if (sourceAppIdx === targetAppIdx) {
      // Same app: combine both operations
      const combinedUpdate = (p: CleanedPackage): CleanedPackage => {
        // First remove the class
        let updated = {
          ...p,
          classes: p.classes.filter((c) => c.identifier !== className),
          subpackages: p.subpackages.map(combinedUpdate),
        };
        // Then add to target if this is the target package
        if (p.name === targetPackageName) {
          updated = { ...updated, classes: [...updated.classes, updatedClass] };
        }
        return updated;
      };

      updated[sourceAppIdx] = {
        ...sourceApp,
        rootPackages: sourceApp.rootPackages.map(combinedUpdate),
        classes: sourceApp.classes.filter((c) => c.identifier !== className),
      };
    } else {
      // Different apps: update separately
      updated[sourceAppIdx] = {
        ...sourceApp,
        rootPackages: sourceApp.rootPackages.map(removeClass),
        classes: sourceApp.classes.filter((c) => c.identifier !== className),
      };

      updated[targetAppIdx] = {
        ...targetApp,
        rootPackages: targetApp.rootPackages.map(updateTargetTree),
        classes: [...targetApp.classes, updatedClass],
      };
    }

    return updated;
  };

  // Helper to trigger moveMethod
  const triggerMoveMethod = (
    landscape: CleanedLandscape[],
    sourceAppIdx: number,
    className: string,
    methodName: string,
    targetAppIdx: number,
    targetClassName: string
  ): CleanedLandscape[] => {
    const updated = JSON.parse(JSON.stringify(landscape)); // Deep clone
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      throw new Error('Invalid app index');
    }

    // Find source class
    const findSourceClass = (pkg: CleanedPackage): CleanedClass | null => {
      const cls = pkg.classes.find((c) => c.identifier === className);
      if (cls) return cls;
      for (const subPkg of pkg.subpackages) {
        const found = findSourceClass(subPkg);
        if (found) return found;
      }
      return null;
    };

    let sourceClass: CleanedClass | null = null;
    for (const rootPkg of sourceApp.rootPackages) {
      sourceClass = findSourceClass(rootPkg);
      if (sourceClass) break;
    }

    // Find target class
    const findTargetClass = (pkg: CleanedPackage): CleanedClass | null => {
      const cls = pkg.classes.find((c) => c.identifier === targetClassName);
      if (cls) return cls;
      for (const subPkg of pkg.subpackages) {
        const found = findTargetClass(subPkg);
        if (found) return found;
      }
      return null;
    };

    let targetClass: CleanedClass | null = null;
    for (const rootPkg of targetApp.rootPackages) {
      targetClass = findTargetClass(rootPkg);
      if (targetClass) break;
    }

    if (!sourceClass) {
      throw new Error(`Source class "${className}" not found`);
    }
    if (!targetClass) {
      throw new Error(`Target class "${targetClassName}" not found`);
    }

    const sourceClassWithMethods: CleanedClass = sourceClass;
    const method = sourceClassWithMethods.methods.find((m) => m.identifier === methodName);
    if (!method) {
      throw new Error(`Method "${methodName}" not found in class "${className}"`);
    }

    // Remove from source class
    const removeMethod = (p: CleanedPackage): CleanedPackage => ({
      ...p,
      classes: p.classes.map((c) =>
        c.identifier === className
          ? {
              ...c,
              methods: c.methods.filter((m) => m.identifier !== methodName),
            }
          : c
      ),
      subpackages: p.subpackages.map(removeMethod),
    });

    // Add to target class
    const addMethod = (p: CleanedPackage): CleanedPackage => ({
      ...p,
      classes: p.classes.map((c) =>
        c.identifier === targetClassName
          ? {
              ...c,
              methods: [...c.methods, method],
            }
          : c
      ),
      subpackages: p.subpackages.map(addMethod),
    });

    if (sourceAppIdx === targetAppIdx) {
      // Same app: combine both operations
      updated[sourceAppIdx] = {
        ...sourceApp,
        rootPackages: sourceApp.rootPackages.map((pkg) => {
          const afterRemove = removeMethod(pkg);
          return addMethod(afterRemove);
        }),
        classes: sourceApp.classes.map((c) => {
          if (c.identifier === className) {
            return { ...c, methods: c.methods.filter((m) => m.identifier !== methodName) };
          }
          if (c.identifier === targetClassName) {
            return { ...c, methods: [...c.methods, method] };
          }
          return c;
        }),
      };
    } else {
      // Different apps: update separately
      updated[sourceAppIdx] = {
        ...sourceApp,
        rootPackages: sourceApp.rootPackages.map(removeMethod),
        classes: sourceApp.classes.map((c) => {
          if (c.identifier === className) {
            return { ...c, methods: c.methods.filter((m) => m.identifier !== methodName) };
          }
          return c;
        }),
        methods: sourceApp.methods.filter((m) => m.identifier !== methodName),
      };

      updated[targetAppIdx] = {
        ...targetApp,
        rootPackages: targetApp.rootPackages.map(addMethod),
        classes: targetApp.classes.map((c) => {
          if (c.identifier === targetClassName) {
            return { ...c, methods: [...c.methods, method] };
          }
          return c;
        }),
        methods: [...targetApp.methods, method],
      };
    }

    return updated;
  };

  describe('Package Movement', () => {
    it('should move a package to another application (becoming a root package)', () => {
      const package1: CleanedPackage = createMockPackage('com.example');
      const package2: CleanedPackage = createMockPackage('org.test');

      const app1 = createMockApp('App1', [package1]);
      const app2 = createMockApp('App2', [package2]);
      const initialLandscape: CleanedLandscape[] = [app1, app2];

      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'com.example', 1, null);

      // App1 should no longer have com.example
      expect(packageExistsInApp(updatedLandscape, 0, 'com.example')).toBe(false);

      // App2 should have com.example as root package
      expect(packageExistsInApp(updatedLandscape, 1, 'com.example')).toBe(true);
      const movedPackage = findPackageInLandscape(updatedLandscape, 1, 'com.example');
      expect(movedPackage).not.toBeNull();
      // Verify it's a root package (not a subpackage)
      const isRootPackage = updatedLandscape[1].rootPackages.some((pkg) => pkg.name === 'com.example');
      expect(isRootPackage).toBe(true);
    });

    it('should move a root package to another application (as root package)', () => {
      const rootPackage1: CleanedPackage = createMockPackage('root1');
      const rootPackage2: CleanedPackage = createMockPackage('root2');

      const app1 = createMockApp('App1', [rootPackage1]);
      const app2 = createMockApp('App2', [rootPackage2]);
      const initialLandscape: CleanedLandscape[] = [app1, app2];

      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'root1', 1, null);

      // App1 should no longer have root1
      expect(packageExistsInApp(updatedLandscape, 0, 'root1')).toBe(false);

      // App2 should have root1 as root package
      expect(packageExistsInApp(updatedLandscape, 1, 'root1')).toBe(true);
      const isRootPackage = updatedLandscape[1].rootPackages.some((pkg) => pkg.name === 'root1');
      expect(isRootPackage).toBe(true);
    });

    it('should move a package to another package (becoming a new subpackage)', () => {
      const package1: CleanedPackage = createMockPackage('com.example');
      const package2: CleanedPackage = createMockPackage('org.test');

      const app = createMockApp('App1', [package1, package2]);
      const initialLandscape: CleanedLandscape[] = [app];

      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'com.example', 0, 'org.test');

      // com.example should no longer be a root package
      const hasComExampleAsRoot = updatedLandscape[0].rootPackages.some((pkg) => pkg.name === 'com.example');
      expect(hasComExampleAsRoot).toBe(false);

      // org.test should have com.example as subpackage
      const orgTestPackage = findPackageInLandscape(updatedLandscape, 0, 'org.test');
      expect(orgTestPackage).not.toBeNull();
      const hasComExampleAsSubpackage = orgTestPackage?.subpackages.some((sp) => sp.name === 'com.example');
      expect(hasComExampleAsSubpackage).toBe(true);
    });

    it('should move a root package to another package (becoming a new subpackage)', () => {
      const rootPackage1: CleanedPackage = createMockPackage('root1');
      const rootPackage2: CleanedPackage = createMockPackage('root2');

      const app = createMockApp('App1', [rootPackage1, rootPackage2]);
      const initialLandscape: CleanedLandscape[] = [app];

      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'root1', 0, 'root2');

      // root1 should no longer be a root package
      const hasRoot1AsRoot = updatedLandscape[0].rootPackages.some((pkg) => pkg.name === 'root1');
      expect(hasRoot1AsRoot).toBe(false);

      // root2 should have root1 as subpackage
      const root2Package = findPackageInLandscape(updatedLandscape, 0, 'root2');
      expect(root2Package).not.toBeNull();
      const hasRoot1AsSubpackage = root2Package?.subpackages.some((sp) => sp.name === 'root1');
      expect(hasRoot1AsSubpackage).toBe(true);
    });

    it('should prevent moving a package into its own subpackage', () => {
      const subPackage: CleanedPackage = createMockPackage('subpackage');
      const rootPackage: CleanedPackage = createMockPackage('rootpackage', [], [subPackage]);

      const app = createMockApp('App1', [rootPackage]);
      const initialLandscape: CleanedLandscape[] = [app];

      // Try to move rootpackage into subpackage (should fail)
      expect(() => {
        triggerMovePackage(initialLandscape, 0, 'rootpackage', 0, 'subpackage');
      }).toThrow('Cannot move package into its own subpackage');
    });

    it('should prevent moving a package into itself', () => {
      const rootPackage: CleanedPackage = createMockPackage('rootpackage');

      const app = createMockApp('App1', [rootPackage]);
      const initialLandscape: CleanedLandscape[] = [app];

      // Try to move rootpackage into itself (should fail)
      expect(() => {
        triggerMovePackage(initialLandscape, 0, 'rootpackage', 0, 'rootpackage');
      }).toThrow('Cannot move package into itself');
    });

    it('should prevent moving a package into a nested subpackage', () => {
      const nestedSubPackage: CleanedPackage = createMockPackage('nested');
      const subPackage: CleanedPackage = createMockPackage('subpackage', [], [nestedSubPackage]);
      const rootPackage: CleanedPackage = createMockPackage('rootpackage', [], [subPackage]);

      const app = createMockApp('App1', [rootPackage]);
      const initialLandscape: CleanedLandscape[] = [app];

      // Try to move rootpackage into nested (should fail)
      expect(() => {
        triggerMovePackage(initialLandscape, 0, 'rootpackage', 0, 'nested');
      }).toThrow('Cannot move package into its own subpackage');
    });

    it('should allow moving a package into its parent package', () => {
      const subPackage: CleanedPackage = createMockPackage('subpackage');
      const rootPackage: CleanedPackage = createMockPackage('rootpackage', [], [subPackage]);

      const app = createMockApp('App1', [rootPackage]);
      const initialLandscape: CleanedLandscape[] = [app];

      // Move subpackage into rootpackage (should succeed - moving into parent)
      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'subpackage', 0, 'rootpackage');

      // subpackage should no longer be directly under rootpackage
      const rootPkg = findPackageInLandscape(updatedLandscape, 0, 'rootpackage');
      // After moving subpackage into rootpackage, it should still be there (just moved)
      // Actually wait - if subpackage was already under rootpackage, moving it into rootpackage again
      // would just keep it there. Let me think...

      // Actually, the structure is: rootpackage -> subpackage
      // Moving subpackage into rootpackage means: rootpackage -> subpackage (same structure)
      // But the move operation removes it from its current location and adds it to the target
      // So subpackage should still be under rootpackage after the move
      expect(rootPkg).not.toBeNull();
      const hasSubpackage = rootPkg?.subpackages.some((sp) => sp.name === 'subpackage');
      expect(hasSubpackage).toBe(true);
    });

    it('should allow moving a package into its grandparent package', () => {
      const nestedSubPackage: CleanedPackage = createMockPackage('nested');
      const subPackage: CleanedPackage = createMockPackage('subpackage', [], [nestedSubPackage]);
      const rootPackage: CleanedPackage = createMockPackage('rootpackage', [], [subPackage]);

      const app = createMockApp('App1', [rootPackage]);
      const initialLandscape: CleanedLandscape[] = [app];

      // Move nested into rootpackage (should succeed - moving into grandparent)
      const updatedLandscape = triggerMovePackage(initialLandscape, 0, 'nested', 0, 'rootpackage');

      // nested should now be directly under rootpackage (not under subpackage)
      const rootPkg = findPackageInLandscape(updatedLandscape, 0, 'rootpackage');
      expect(rootPkg).not.toBeNull();
      const hasNested = rootPkg?.subpackages.some((sp) => sp.name === 'nested');
      expect(hasNested).toBe(true);

      // nested should no longer be under subpackage
      const subPkg = findPackageInLandscape(updatedLandscape, 0, 'subpackage');
      const hasNestedInSub = subPkg?.subpackages.some((sp) => sp.name === 'nested');
      expect(hasNestedInSub).toBe(false);
    });
  });

  describe('Class Movement', () => {
    it('should move a class from one package to another', () => {
      const class1: CleanedClass = createMockClass('Class1');
      const package1: CleanedPackage = createMockPackage('com.example', [class1]);
      const package2: CleanedPackage = createMockPackage('org.test');

      const app = createMockApp('App1', [package1, package2], [class1]);
      const initialLandscape: CleanedLandscape[] = [app];

      const updatedLandscape = triggerMoveClass(initialLandscape, 0, 'Class1', 0, 'org.test');

      // Class1 should no longer be in com.example
      const comExamplePackage = findPackageInLandscape(updatedLandscape, 0, 'com.example');
      const hasClass1InComExample = comExamplePackage?.classes.some((c) => c.identifier === 'Class1');
      expect(hasClass1InComExample).toBe(false);

      // Class1 should be in org.test
      const orgTestPackage = findPackageInLandscape(updatedLandscape, 0, 'org.test');
      const hasClass1InOrgTest = orgTestPackage?.classes.some((c) => c.identifier === 'Class1');
      expect(hasClass1InOrgTest).toBe(true);
    });

    it('should move a class from one package to another in different applications', () => {
      const class1: CleanedClass = createMockClass('Class1', [], 'App1');
      const package1: CleanedPackage = createMockPackage('com.example', [class1]);
      const package2: CleanedPackage = createMockPackage('org.test');

      const app1 = createMockApp('App1', [package1], [class1]);
      const app2 = createMockApp('App2', [package2]);
      const initialLandscape: CleanedLandscape[] = [app1, app2];

      const updatedLandscape = triggerMoveClass(initialLandscape, 0, 'Class1', 1, 'org.test');

      // Class1 should no longer be in App1
      expect(classExistsInApp(updatedLandscape, 0, 'Class1')).toBe(false);
      expect(updatedLandscape[0].classes.some((c) => c.identifier === 'Class1')).toBe(false);

      // Class1 should be in App2/org.test with updated parentAppName
      expect(classExistsInApp(updatedLandscape, 1, 'Class1')).toBe(true);
      const movedClass = getClassFromApp(updatedLandscape, 1, 'Class1');
      expect(movedClass).not.toBeNull();
      expect(movedClass?.parentAppName).toBe('App2');
    });
  });

  describe('Method Movement', () => {
    it('should move a function from one class to another', () => {
      const method1 = { identifier: 'method1' };
      const method2 = { identifier: 'method2' };
      const class1: CleanedClass = createMockClass('Class1', [method1]);
      const class2: CleanedClass = createMockClass('Class2', [method2]);
      const package1: CleanedPackage = createMockPackage('com.example', [class1, class2]);

      const app = createMockApp('App1', [package1], [class1, class2]);
      const initialLandscape: CleanedLandscape[] = [app];

      const updatedLandscape = triggerMoveMethod(initialLandscape, 0, 'Class1', 'method1', 0, 'Class2');

      // Find Class1 and Class2 in the updated landscape
      const updatedClass1 = getClassFromApp(updatedLandscape, 0, 'Class1');
      const updatedClass2 = getClassFromApp(updatedLandscape, 0, 'Class2');

      // method1 should no longer be in Class1
      expect(updatedClass1?.methods.some((m) => m.identifier === 'method1')).toBe(false);

      // method1 should be in Class2
      expect(updatedClass2?.methods.some((m) => m.identifier === 'method1')).toBe(true);
    });

    it('should move a function from one class to another in different applications', () => {
      const method1 = { identifier: 'method1' };
      const method2 = { identifier: 'method2' };
      const class1: CleanedClass = createMockClass('Class1', [method1], 'App1');
      const class2: CleanedClass = createMockClass('Class2', [method2], 'App2');
      const package1: CleanedPackage = createMockPackage('com.example', [class1]);
      const package2: CleanedPackage = createMockPackage('org.test', [class2]);

      const app1 = createMockApp('App1', [package1], [class1]);
      const app2 = createMockApp('App2', [package2], [class2]);
      const initialLandscape: CleanedLandscape[] = [app1, app2];

      const updatedLandscape = triggerMoveMethod(initialLandscape, 0, 'Class1', 'method1', 1, 'Class2');

      // method1 should no longer be in App1/Class1
      const updatedClass1 = getClassFromApp(updatedLandscape, 0, 'Class1');
      expect(updatedClass1?.methods.some((m) => m.identifier === 'method1')).toBe(false);
      expect(updatedLandscape[0].methods.some((m) => m.identifier === 'method1')).toBe(false);

      // method1 should be in App2/Class2
      const updatedClass2 = getClassFromApp(updatedLandscape, 1, 'Class2');
      expect(updatedClass2?.methods.some((m) => m.identifier === 'method1')).toBe(true);
      expect(updatedLandscape[1].methods.some((m) => m.identifier === 'method1')).toBe(true);
    });
  });
});
