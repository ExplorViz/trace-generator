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
      const newPkg: CleanedPackage = {
        name: packageName.trim(),
        classes: [],
        subpackages: [],
      };
      updated[appIdx] = {
        ...app,
        rootPackages: [...app.rootPackages, newPkg],
        packages: [...app.packages, newPkg],
      };
      updateLocalLandscape(updated);
    }
  };

  const addPackage = (appIdx: number) => {
    const packageName = prompt('Enter package name:', 'newpackage');
    if (packageName && packageName.trim() !== '') {
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
        name: packageName.trim(),
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
      const newPkg: CleanedPackage = {
        name: packageName.trim(),
        classes: [],
        subpackages: [],
      };
      const updatePkg = (p: CleanedPackage): CleanedPackage => {
        if (p.name === parentPackageName) {
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
