import { FakeApp, FakePackage, FakeClass, CleanedLandscape, CleanedPackage, CleanedClass } from '@shared/types';
import { getClassFqn } from '../../generation';

// Re-export types for convenience
export type { CleanedLandscape, CleanedPackage, CleanedClass };

/**
 * Clean landscape for JSON serialization (remove circular references)
 */
export function cleanLandscapeForSerialization(landscape: Array<FakeApp>): CleanedLandscape[] {
  return landscape.map((app) => {
    const entryPointFqn = getClassFqn(app.entryPoint);
    return {
      name: app.name,
      rootPackage: cleanPackage(app.rootPackage),
      entryPointFqn,
      classes: app.classes.map(cleanClass),
      packages: app.packages.map(cleanPackage),
      methods: app.methods,
    };
  });
}

function cleanPackage(pkg: FakePackage): CleanedPackage {
  return {
    name: pkg.name,
    classes: pkg.classes.map(cleanClass),
    subpackages: pkg.subpackages.map(cleanPackage),
  };
}

function cleanClass(cls: FakeClass): CleanedClass {
  return {
    identifier: cls.identifier,
    methods: cls.methods,
    parentAppName: cls.parentAppName,
  };
}

/**
 * Find class by FQN in an app
 */
function findClassByFqn(app: FakeApp, fqn: string): FakeClass | null {
  function searchInPackage(pkg: FakePackage): FakeClass | null {
    for (const cls of pkg.classes) {
      const clsFqn = getClassFqn(cls);
      if (clsFqn === fqn) {
        return cls;
      }
    }
    for (const subPkg of pkg.subpackages) {
      const found = searchInPackage(subPkg);
      if (found) return found;
    }
    return null;
  }

  return searchInPackage(app.rootPackage);
}

/**
 * Reconstruct parent references after deserialization
 */
export function reconstructParentReferences(landscapeData: Array<any>): Array<FakeApp> {
  return landscapeData.map((appData: any) => {
    const app: FakeApp = {
      name: appData.name,
      rootPackage: appData.rootPackage,
      entryPoint: null as any, // Will be set below
      classes: appData.classes,
      packages: appData.packages,
      methods: appData.methods,
    };

    function setParentForPackage(pkg: FakePackage, parent?: FakePackage) {
      pkg.parent = parent;
      pkg.classes.forEach((cls) => {
        cls.parent = pkg;
      });
      pkg.subpackages.forEach((subPkg) => {
        setParentForPackage(subPkg, pkg);
      });
    }

    if (app.rootPackage) {
      setParentForPackage(app.rootPackage);
    }

    // Reconstruct entryPoint reference from FQN
    if (appData.entryPointFqn) {
      const entryPoint = findClassByFqn(app, appData.entryPointFqn);
      if (entryPoint) {
        app.entryPoint = entryPoint;
      } else {
        app.entryPoint = app.classes[0];
      }
    } else {
      app.entryPoint = app.classes[0];
    }

    return app;
  });
}
