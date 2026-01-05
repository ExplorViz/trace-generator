import { CleanedClass, CleanedLandscape, CleanedPackage } from '../../backend/shared/types';
import React, { useRef, useState } from 'react';
import { AppNode } from './landscape-editor/AppNode';
import { LandscapeToolbar } from './landscape-editor/LandscapeToolbar';
import { LandscapeEditorHandlers, NodeId } from './landscape-editor/types';
import { generateNodeId } from './landscape-editor/utils';

interface LandscapeEditorProps {
  landscape: CleanedLandscape[];
  onLandscapeUpdated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
}

export function LandscapeEditor({ landscape, onLandscapeUpdated, onError }: LandscapeEditorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<NodeId>>(new Set());
  const [localLandscape, setLocalLandscape] = useState<CleanedLandscape[]>(landscape);
  const isInternalUpdateRef = useRef(false);

  React.useEffect(() => {
    // Only update local landscape if the change came from outside (prop change)
    // Skip if it's from an internal user edit (which already updated localLandscape)
    if (!isInternalUpdateRef.current) {
      setLocalLandscape(landscape);
    }
    isInternalUpdateRef.current = false;
  }, [landscape]);

  const toggleNode = (nodeId: NodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allNodes = new Set<NodeId>();
    localLandscape.forEach((app, appIdx) => {
      allNodes.add(generateNodeId('app', appIdx));
      const collectNodes = (pkg: CleanedPackage) => {
        allNodes.add(generateNodeId('pkg', appIdx, pkg.name.replace(/\./g, '_')));
        pkg.subpackages.forEach((subPkg) => collectNodes(subPkg));
        pkg.classes.forEach((cls) => {
          allNodes.add(generateNodeId('cls', appIdx, cls.identifier.replace(/\./g, '_')));
        });
      };
      app.rootPackages.forEach((rootPkg) => {
        collectNodes(rootPkg);
      });
    });
    setExpandedNodes(allNodes);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const saveLandscape = () => {
    try {
      const jsonString = JSON.stringify(localLandscape, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `landscape-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message || 'Failed to save landscape');
    }
  };

  const loadLandscape = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          onError('Invalid landscape file: must be an array');
          return;
        }

        setLocalLandscape(parsed);
        onLandscapeUpdated(parsed);
        setExpandedNodes(new Set());
      } catch (err: any) {
        onError(err.message || 'Failed to load landscape file');
      }
    };
    reader.onerror = () => {
      onError('Failed to read landscape file');
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const findPackage = (app: CleanedLandscape, packageName: string): CleanedPackage | null => {
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

  const findClass = (app: CleanedLandscape, className: string): CleanedClass | null => {
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

  /**
   * Helper function to create or find a package hierarchy from a dot-separated package name.
   * Returns the deepest package and all newly created packages.
   */
  const createPackageHierarchy = (
    parentPackages: CleanedPackage[],
    packageNameParts: string[]
  ): { deepestPackage: CleanedPackage; allCreatedPackages: CleanedPackage[] } => {
    const allCreatedPackages: CleanedPackage[] = [];
    let currentPackages = parentPackages;
    let deepestPackage: CleanedPackage | null = null;

    for (let i = 0; i < packageNameParts.length; i++) {
      const partName = packageNameParts[i];
      let foundPackage = currentPackages.find((pkg) => pkg.name === partName);

      if (!foundPackage) {
        // Create new package
        foundPackage = {
          name: partName,
          classes: [],
          subpackages: [],
        };
        allCreatedPackages.push(foundPackage);
        // Add to current packages array (either parentPackages for root, or deepestPackage.subpackages for nested)
        if (deepestPackage) {
          deepestPackage.subpackages.push(foundPackage);
        } else {
          // This is the first level - add to parentPackages array
          parentPackages.push(foundPackage);
        }
      }

      deepestPackage = foundPackage;
      currentPackages = foundPackage.subpackages;
    }

    if (!deepestPackage) {
      throw new Error('Failed to create package hierarchy');
    }

    return { deepestPackage, allCreatedPackages };
  };

  const updateLocalLandscape = (updated: CleanedLandscape[]) => {
    isInternalUpdateRef.current = true;
    setLocalLandscape(updated);
    onLandscapeUpdated(updated);
  };

  const renameApp = (appIdx: number) => {
    const app = localLandscape[appIdx];
    const newName = prompt('Enter new app name:', app.name);
    if (newName && newName.trim() !== '') {
      const updated = [...localLandscape];
      updated[appIdx] = { ...app, name: newName.trim() };
      updateLocalLandscape(updated);
    }
  };

  const renamePackage = (appIdx: number, packageName: string) => {
    const app = localLandscape[appIdx];
    const pkg = findPackage(app, packageName);
    if (pkg) {
      const newName = prompt('Enter new package name:', pkg.name);
      if (newName && newName.trim() !== '') {
        const updated = [...localLandscape];
        const updatePkg = (p: CleanedPackage): CleanedPackage => {
          if (p.name === packageName) {
            return { ...p, name: newName.trim() };
          }
          return {
            ...p,
            subpackages: p.subpackages.map(updatePkg),
          };
        };
        updated[appIdx] = {
          ...app,
          rootPackages: app.rootPackages.map(updatePkg),
        };
        updateLocalLandscape(updated);
      }
    }
  };

  const renameClass = (appIdx: number, className: string) => {
    const app = localLandscape[appIdx];
    const cls = findClass(app, className);
    if (cls) {
      const newName = prompt('Enter new class name:', cls.identifier);
      if (newName && newName.trim() !== '') {
        const updated = [...localLandscape];
        const updateClass = (p: CleanedPackage): CleanedPackage => ({
          ...p,
          classes: p.classes.map((c) => (c.identifier === className ? { ...c, identifier: newName.trim() } : c)),
          subpackages: p.subpackages.map(updateClass),
        });
        updated[appIdx] = {
          ...app,
          rootPackages: app.rootPackages.map(updateClass),
          classes: app.classes.map((c) => (c.identifier === className ? { ...c, identifier: newName.trim() } : c)),
        };
        updateLocalLandscape(updated);
      }
    }
  };

  const renameMethod = (appIdx: number, className: string, methodName: string) => {
    const app = localLandscape[appIdx];
    const cls = findClass(app, className);
    if (cls) {
      const method = cls.methods.find((m) => m.identifier === methodName);
      if (method) {
        const newName = prompt('Enter new method name:', method.identifier);
        if (newName && newName.trim() !== '') {
          const updated = [...localLandscape];
          const updateMethod = (p: CleanedPackage): CleanedPackage => ({
            ...p,
            classes: p.classes.map((c) =>
              c.identifier === className
                ? {
                    ...c,
                    methods: c.methods.map((m) => (m.identifier === methodName ? { identifier: newName.trim() } : m)),
                  }
                : c
            ),
            subpackages: p.subpackages.map(updateMethod),
          });
          updated[appIdx] = {
            ...app,
            rootPackages: app.rootPackages.map(updateMethod),
            classes: app.classes.map((c) =>
              c.identifier === className
                ? {
                    ...c,
                    methods: c.methods.map((m) => (m.identifier === methodName ? { identifier: newName.trim() } : m)),
                  }
                : c
            ),
          };
          updateLocalLandscape(updated);
        }
      }
    }
  };

  const addRootPackage = (appIdx: number) => {
    const packageName = prompt('Enter root package name:', 'newpackage');
    if (packageName && packageName.trim() !== '') {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const packageNameParts = packageName.trim().split('.');

      // Create a copy of rootPackages to avoid mutating the original
      const rootPackagesCopy = [...app.rootPackages];

      // Create or find the package hierarchy
      const { allCreatedPackages } = createPackageHierarchy(rootPackagesCopy, packageNameParts);

      updated[appIdx] = {
        ...app,
        rootPackages: rootPackagesCopy,
        packages: [...app.packages, ...allCreatedPackages],
      };
      updateLocalLandscape(updated);
    }
  };

  const addPackage = (appIdx: number) => {
    const packageName = prompt('Enter package name:', 'newpackage');
    if (packageName && packageName.trim() !== '') {
      const trimmedName = packageName.trim();

      // If the package name contains dots, treat it as a hierarchy and add as root package
      if (trimmedName.includes('.')) {
        const updated = [...localLandscape];
        const app = updated[appIdx];
        const packageNameParts = trimmedName.split('.');

        // Create a copy of rootPackages to avoid mutating the original
        const rootPackagesCopy = [...app.rootPackages];

        // Create or find the package hierarchy
        const { allCreatedPackages } = createPackageHierarchy(rootPackagesCopy, packageNameParts);

        updated[appIdx] = {
          ...app,
          rootPackages: rootPackagesCopy,
          packages: [...app.packages, ...allCreatedPackages],
        };
        updateLocalLandscape(updated);
        return;
      }

      // For non-hierarchical names, use the existing behavior
      const updated = [...localLandscape];
      const app = updated[appIdx];
      // Find the first root package to add subpackage to
      if (app.rootPackages.length === 0) {
        // If no root packages, create one first
        addRootPackage(appIdx);
        return;
      }
      let targetPkg = app.rootPackages[0];
      if (targetPkg.subpackages.length > 0) {
        targetPkg = targetPkg.subpackages[0];
        if (targetPkg.subpackages.length > 0) {
          targetPkg = targetPkg.subpackages[0];
        }
      }
      const newPkg: CleanedPackage = {
        name: trimmedName,
        classes: [],
        subpackages: [],
      };
      const updatePkg = (p: CleanedPackage): CleanedPackage => {
        if (p.name === targetPkg.name) {
          return { ...p, subpackages: [...p.subpackages, newPkg] };
        }
        return { ...p, subpackages: p.subpackages.map(updatePkg) };
      };
      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(updatePkg),
        packages: [...app.packages, newPkg],
      };
      updateLocalLandscape(updated);
    }
  };

  const addSubPackage = (appIdx: number, parentPackageName: string) => {
    const packageName = prompt('Enter subpackage name:', 'newsubpackage');
    if (packageName && packageName.trim() !== '') {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const packageNameParts = packageName.trim().split('.');

      // Find the parent package in the updated landscape
      const findPkgInUpdated = (p: CleanedPackage): CleanedPackage | null => {
        if (p.name === parentPackageName) return p;
        for (const subPkg of p.subpackages) {
          const found = findPkgInUpdated(subPkg);
          if (found) return found;
        }
        return null;
      };

      let parentPkg: CleanedPackage | null = null;
      for (const rootPkg of app.rootPackages) {
        parentPkg = findPkgInUpdated(rootPkg);
        if (parentPkg) break;
      }

      if (!parentPkg) {
        onError(`Parent package "${parentPackageName}" not found`);
        return;
      }

      // Create or find the package hierarchy under the parent
      const { allCreatedPackages } = createPackageHierarchy(parentPkg.subpackages, packageNameParts);

      // Update the parent package in the tree to ensure React detects the change
      const updatePkg = (p: CleanedPackage): CleanedPackage => {
        if (p.name === parentPackageName) {
          return { ...p, subpackages: [...parentPkg!.subpackages] };
        }
        return { ...p, subpackages: p.subpackages.map(updatePkg) };
      };

      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(updatePkg),
        packages: [...app.packages, ...allCreatedPackages],
      };
      updateLocalLandscape(updated);
    }
  };

  const addClass = (appIdx: number, packageName: string) => {
    const className = prompt('Enter class name:', 'NewClass');
    if (className && className.trim() !== '') {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const newClass: CleanedClass = {
        identifier: className.trim(),
        methods: [],
        parentAppName: app.name,
      };
      const updatePkg = (p: CleanedPackage): CleanedPackage => {
        if (p.name === packageName) {
          return { ...p, classes: [...p.classes, newClass] };
        }
        return { ...p, subpackages: p.subpackages.map(updatePkg) };
      };
      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(updatePkg),
        classes: [...app.classes, newClass],
      };
      updateLocalLandscape(updated);
    }
  };

  const addMethod = (appIdx: number, className: string) => {
    const methodName = prompt('Enter method name:', 'newMethod');
    if (methodName && methodName.trim() !== '') {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const newMethod = { identifier: methodName.trim() };
      const updateMethod = (p: CleanedPackage): CleanedPackage => ({
        ...p,
        classes: p.classes.map((c) => (c.identifier === className ? { ...c, methods: [...c.methods, newMethod] } : c)),
        subpackages: p.subpackages.map(updateMethod),
      });
      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(updateMethod),
        classes: app.classes.map((c) =>
          c.identifier === className ? { ...c, methods: [...c.methods, newMethod] } : c
        ),
        methods: [...app.methods, newMethod],
      };
      updateLocalLandscape(updated);
    }
  };

  const deleteApp = (appIdx: number) => {
    if (confirm('Are you sure you want to delete this app?')) {
      const updated = localLandscape.filter((_, idx) => idx !== appIdx);
      updateLocalLandscape(updated);
    }
  };

  const deletePackage = (appIdx: number, packageName: string) => {
    if (confirm(`Are you sure you want to delete package "${packageName}" and all its contents?`)) {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const removePkg = (p: CleanedPackage): CleanedPackage | null => {
        if (p.name === packageName) return null;
        return {
          ...p,
          subpackages: p.subpackages.map(removePkg).filter((p): p is CleanedPackage => p !== null),
        };
      };
      const cleanedRootPackages = app.rootPackages.map(removePkg).filter((p): p is CleanedPackage => p !== null);
      updated[appIdx] = { ...app, rootPackages: cleanedRootPackages };
      updateLocalLandscape(updated);
    }
  };

  const deleteClass = (appIdx: number, className: string) => {
    if (confirm(`Are you sure you want to delete class "${className}"?`)) {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      const removeClass = (p: CleanedPackage): CleanedPackage => ({
        ...p,
        classes: p.classes.filter((c) => c.identifier !== className),
        subpackages: p.subpackages.map(removeClass),
      });
      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(removeClass),
        classes: app.classes.filter((c) => c.identifier !== className),
      };
      updateLocalLandscape(updated);
    }
  };

  const deleteMethod = (appIdx: number, className: string, methodName: string) => {
    if (confirm(`Are you sure you want to delete method "${methodName}"?`)) {
      const updated = [...localLandscape];
      const app = updated[appIdx];
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
      updated[appIdx] = {
        ...app,
        rootPackages: app.rootPackages.map(removeMethod),
        classes: app.classes.map((c) =>
          c.identifier === className
            ? {
                ...c,
                methods: c.methods.filter((m) => m.identifier !== methodName),
              }
            : c
        ),
        methods: app.methods.filter((m) => m.identifier !== methodName),
      };
      updateLocalLandscape(updated);
    }
  };

  const movePackage = (
    sourceAppIdx: number,
    sourcePackageName: string,
    targetAppIdx: number,
    targetPackageName: string | null
  ) => {
    const updated = [...localLandscape];
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      onError('Invalid app index');
      return;
    }

    let sourcePackage: CleanedPackage | null = null;
    let sourceParent: CleanedPackage | null = null;
    let sourceParentArray: CleanedPackage[] | null = null;

    // Find source package and its parent
    const findSource = (pkg: CleanedPackage, parent: CleanedPackage | null, parentArray: CleanedPackage[]): boolean => {
      if (pkg.name === sourcePackageName) {
        sourcePackage = pkg;
        sourceParent = parent;
        sourceParentArray = parentArray;
        return true;
      }
      for (let i = 0; i < pkg.subpackages.length; i++) {
        if (findSource(pkg.subpackages[i], pkg, pkg.subpackages)) {
          return true;
        }
      }
      return false;
    };

    for (let i = 0; i < sourceApp.rootPackages.length; i++) {
      if (findSource(sourceApp.rootPackages[i], null, sourceApp.rootPackages)) {
        break;
      }
    }

    if (!sourcePackage || !sourceParentArray) {
      onError(`Source package "${sourcePackageName}" not found`);
      return;
    }

    // Store references after null check for proper type narrowing
    const packageToMove = sourcePackage;
    const parentArray: CleanedPackage[] = sourceParentArray;

    // Prevent moving package into itself or its descendants (only if same app)
    if (sourceAppIdx === targetAppIdx && targetPackageName) {
      const targetPkg = findPackage(targetApp, targetPackageName);
      if (targetPkg) {
        // Check if targetPkg is the source package itself
        if (targetPkg === packageToMove) {
          onError('Cannot move package into itself');
          return;
        }
        // Check if targetPkg is a descendant (subpackage) of the source package
        // We need to traverse the source package's subpackages to see if targetPkg is found
        const isDescendantOfSource = (pkg: CleanedPackage): boolean => {
          if (pkg === targetPkg) return true;
          return pkg.subpackages.some(isDescendantOfSource);
        };
        if (isDescendantOfSource(packageToMove)) {
          onError('Cannot move package into its own subpackage');
          return;
        }
      }
    }

    // Remove from source
    const sourceIndex = parentArray.findIndex((p: CleanedPackage) => p.name === sourcePackageName);
    if (sourceIndex === -1) {
      onError(`Source package "${sourcePackageName}" not found in parent`);
      return;
    }
    parentArray.splice(sourceIndex, 1);

    // Add to target
    if (targetPackageName === null) {
      // Move to root of target app
      targetApp.rootPackages.push(packageToMove);
    } else {
      const targetPkg = findPackage(targetApp, targetPackageName);
      if (!targetPkg) {
        onError(`Target package "${targetPackageName}" not found`);
        return;
      }
      targetPkg.subpackages.push(packageToMove);
    }

    // Update the tree structure for source app
    const updateSourceTree = (p: CleanedPackage): CleanedPackage => {
      if (sourceParent && p.name === sourceParent.name) {
        return { ...p, subpackages: [...p.subpackages] };
      }
      return { ...p, subpackages: p.subpackages.map(updateSourceTree) };
    };

    updated[sourceAppIdx] = {
      ...sourceApp,
      rootPackages: sourceApp.rootPackages.map(updateSourceTree),
    };

    // Update the tree structure for target app
    if (targetPackageName) {
      const updateTargetTree = (p: CleanedPackage): CleanedPackage => {
        if (p.name === targetPackageName) {
          return { ...p, subpackages: [...p.subpackages] };
        }
        return { ...p, subpackages: p.subpackages.map(updateTargetTree) };
      };
      updated[targetAppIdx] = {
        ...targetApp,
        rootPackages: targetApp.rootPackages.map(updateTargetTree),
      };
    }

    updateLocalLandscape(updated);
  };

  const moveClass = (sourceAppIdx: number, className: string, targetAppIdx: number, targetPackageName: string) => {
    const updated = [...localLandscape];
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      onError('Invalid app index');
      return;
    }

    const sourceClass = findClass(sourceApp, className);
    if (!sourceClass) {
      onError(`Class "${className}" not found`);
      return;
    }

    const targetPkg = findPackage(targetApp, targetPackageName);
    if (!targetPkg) {
      onError(`Target package "${targetPackageName}" not found`);
      return;
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

    updateLocalLandscape(updated);
  };

  const moveMethod = (
    sourceAppIdx: number,
    className: string,
    methodName: string,
    targetAppIdx: number,
    targetClassName: string
  ) => {
    const updated = [...localLandscape];
    const sourceApp = updated[sourceAppIdx];
    const targetApp = updated[targetAppIdx];

    if (!sourceApp || !targetApp) {
      onError('Invalid app index');
      return;
    }

    const sourceClass = findClass(sourceApp, className);
    const targetClass = findClass(targetApp, targetClassName);

    if (!sourceClass) {
      onError(`Source class "${className}" not found`);
      return;
    }
    if (!targetClass) {
      onError(`Target class "${targetClassName}" not found`);
      return;
    }

    const method = sourceClass.methods.find((m) => m.identifier === methodName);
    if (!method) {
      onError(`Method "${methodName}" not found in class "${className}"`);
      return;
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
        methods: sourceApp.methods.map((m) => (m.identifier === methodName ? method : m)),
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

    updateLocalLandscape(updated);
  };

  const addApp = () => {
    const appName = prompt('Enter app name:', 'newapp');
    if (appName && appName.trim() !== '') {
      const rootPkg3: CleanedPackage = {
        name: appName.trim().replace(/-/g, ''),
        classes: [],
        subpackages: [],
      };
      const rootPkg2: CleanedPackage = {
        name: 'tracegenerator',
        classes: [],
        subpackages: [rootPkg3],
      };
      const rootPkg1: CleanedPackage = {
        name: 'org',
        classes: [],
        subpackages: [rootPkg2],
      };
      const defaultClass: CleanedClass = {
        identifier: 'Main',
        methods: [{ identifier: 'main' }],
        parentAppName: appName.trim(),
      };
      rootPkg3.classes.push(defaultClass);
      const newApp: CleanedLandscape = {
        name: appName.trim(),
        rootPackages: [rootPkg1],
        entryPointFqn: `org.tracegenerator.${appName.trim()}.Main`,
        classes: [defaultClass],
        packages: [rootPkg2, rootPkg3],
        methods: [defaultClass.methods[0]],
      };
      const updated = [...localLandscape, newApp];
      updateLocalLandscape(updated);
    }
  };

  const handlers: LandscapeEditorHandlers = {
    onLandscapeUpdated,
    onError,
    toggleNode,
    renameApp,
    renamePackage,
    renameClass,
    renameMethod,
    addRootPackage,
    addPackage,
    addSubPackage,
    addClass,
    addMethod,
    deleteApp,
    deletePackage,
    deleteClass,
    deleteMethod,
    movePackage,
    moveClass,
    moveMethod,
  };

  return (
    <div>
      <LandscapeToolbar
        onAddApp={addApp}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onSaveLandscape={saveLandscape}
        onLoadLandscape={loadLandscape}
      />
      <div className="material-card p-4 max-h-[600px] overflow-y-auto font-mono text-sm bg-light">
        {localLandscape.length === 0 ? (
          <p className="text-muted">No landscape generated yet. Generate one above!</p>
        ) : (
          localLandscape.map((app, appIdx) => {
            const appNodeId = generateNodeId('app', appIdx);
            const hasChildren =
              app.rootPackages.length > 0 &&
              app.rootPackages.some((rootPkg) => rootPkg.subpackages.length > 0 || rootPkg.classes.length > 0);
            const isExpanded = expandedNodes.has(appNodeId);

            return (
              <AppNode
                key={appNodeId}
                app={app}
                appIdx={appIdx}
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                handlers={handlers}
                expandedNodes={expandedNodes}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
