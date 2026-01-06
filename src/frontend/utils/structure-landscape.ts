import { CleanedClass, CleanedLandscape, CleanedPackage } from '../../backend/shared/types';

/**
 * Structure JSON format types (for conversion)
 */
interface StructureMethod {
  name: string;
  methodHash?: string;
}

interface StructureClass {
  name: string;
  methods: StructureMethod[];
}

interface StructurePackage {
  name: string;
  subPackages: StructurePackage[];
  classes: StructureClass[];
}

interface StructureApplication {
  name: string;
  language: string;
  instanceId: string;
  packages: StructurePackage[];
}

interface StructureNode {
  ipAddress: string;
  hostName: string;
  applications: StructureApplication[];
}

interface StructureLandscape {
  landscapeToken: string;
  nodes: StructureNode[];
}

/**
 * Check if the given data is a structure landscape JSON format
 */
export function isStructureLandscape(data: any): data is StructureLandscape {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.landscapeToken === 'string' &&
    Array.isArray(data.nodes) &&
    data.nodes.length > 0 &&
    data.nodes.every((node: any) => typeof node === 'object' && node !== null && Array.isArray(node.applications))
  );
}

/**
 * Convert structure landscape format to regular landscape format
 */
export function convertStructureLandscapeToRegular(structureData: StructureLandscape): CleanedLandscape[] {
  const landscapes: CleanedLandscape[] = [];

  // Process each node
  for (const node of structureData.nodes) {
    // Process each application in the node
    for (const app of node.applications) {
      const allClasses: CleanedClass[] = [];
      const allPackages: CleanedPackage[] = [];
      const allMethodsSet = new Set<string>();

      // Convert structure packages to regular packages recursively
      function convertPackage(structPkg: StructurePackage): CleanedPackage {
        const regularPkg: CleanedPackage = {
          name: structPkg.name,
          classes: [],
          subpackages: [],
        };

        // Convert classes
        for (const structClass of structPkg.classes) {
          const methods: string[] = [];
          for (const structMethod of structClass.methods) {
            const methodName = structMethod.name;
            methods.push(methodName);
            // Deduplicate methods by name
            if (!allMethodsSet.has(methodName)) {
              allMethodsSet.add(methodName);
            }
          }

          const regularClass: CleanedClass = {
            identifier: structClass.name,
            methods,
            parentAppName: app.name,
          };

          regularPkg.classes.push(regularClass);
          allClasses.push(regularClass);
        }

        // Convert subpackages recursively
        for (const structSubPkg of structPkg.subPackages) {
          const regularSubPkg = convertPackage(structSubPkg);
          regularPkg.subpackages.push(regularSubPkg);
        }

        allPackages.push(regularPkg);
        return regularPkg;
      }

      // Convert all root packages
      const rootPackages: CleanedPackage[] = app.packages.map((structPkg) => convertPackage(structPkg));

      // Build FQN for entry point - find first class with methods, or first class
      let entryPointFqn = '';
      if (allClasses.length > 0) {
        const entryPointClass = allClasses.find((cls) => cls.methods.length > 0) || allClasses[0];

        // Build FQN by traversing package tree
        function buildFqnForClass(cls: CleanedClass): string {
          // Find the package containing this class
          function findPackageForClass(pkg: CleanedPackage, path: string[]): string | null {
            if (pkg.classes.includes(cls)) {
              path.push(pkg.name);
              path.push(cls.identifier);
              return path.join('.');
            }
            for (const subPkg of pkg.subpackages) {
              const found = findPackageForClass(subPkg, [...path, pkg.name]);
              if (found) return found;
            }
            return null;
          }

          for (const rootPkg of rootPackages) {
            const fqn = findPackageForClass(rootPkg, []);
            if (fqn) return fqn;
          }

          // Fallback: just return class name
          return cls.identifier;
        }

        entryPointFqn = buildFqnForClass(entryPointClass);
      }

      landscapes.push({
        name: app.name,
        rootPackages,
        entryPointFqn,
        classes: allClasses,
        packages: allPackages,
        methods: Array.from(allMethodsSet),
      });
    }
  }

  return landscapes;
}
