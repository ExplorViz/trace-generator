import { getClassFqn } from '../generation';
import { CleanedClass, CleanedLandscape, CleanedPackage, FakeApp, FakeClass, FakePackage } from '../shared/types';

// Re-export types for convenience
export type { CleanedClass, CleanedLandscape, CleanedPackage };

/**
 * Clean landscape for JSON serialization (remove circular references)
 */
export function cleanLandscapeForSerialization(landscape: Array<FakeApp>): CleanedLandscape[] {
  return landscape.map((app) => {
    const entryPointFqn = getClassFqn(app.entryPoint);
    return {
      name: app.name,
      rootPackages: app.rootPackages.map(cleanPackage),
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
 * Reconstruct parent references after deserialization
 */
export function reconstructParentReferences(landscapeData: Array<any>): Array<FakeApp> {
  return landscapeData.map((appData: any) => {
    const rootPackages: FakePackage[] = appData.rootPackages || [];

    const app: FakeApp = {
      name: appData.name,
      rootPackages: rootPackages,
      entryPoint: null as any, // Will be set below
      classes: [],
      packages: [],
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

    // Helper to collect all classes from package tree
    function collectClasses(pkg: FakePackage): FakeClass[] {
      const classes = [...pkg.classes];
      pkg.subpackages.forEach((subPkg) => {
        classes.push(...collectClasses(subPkg));
      });
      return classes;
    }

    // Helper to collect all packages from package tree
    function collectPackages(pkg: FakePackage): FakePackage[] {
      const packages = [pkg];
      pkg.subpackages.forEach((subPkg) => {
        packages.push(...collectPackages(subPkg));
      });
      return packages;
    }

    // Process all root packages
    rootPackages.forEach((rootPkg) => {
      setParentForPackage(rootPkg);
      // Rebuild flat arrays from tree to ensure same object references
      app.classes.push(...collectClasses(rootPkg));
      app.packages.push(...collectPackages(rootPkg));
    });

    // Reconstruct entryPoint reference from FQN
    if (appData.entryPointFqn) {
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

        // Search through all root packages
        for (const rootPkg of app.rootPackages) {
          const found = searchInPackage(rootPkg);
          if (found) return found;
        }
        return null;
      }

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
