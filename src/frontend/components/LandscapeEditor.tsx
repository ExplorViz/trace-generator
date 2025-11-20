import React, { useState, useCallback } from 'react';
import { CleanedLandscape, CleanedPackage, CleanedClass } from '@shared/types';
import { apiClient } from '../api/client';
import {
  Smartphone,
  Package,
  FileCode,
  Zap,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Circle,
  Save,
  RefreshCw,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';

interface LandscapeEditorProps {
  landscape: CleanedLandscape[];
  onLandscapeUpdated: (landscape: CleanedLandscape[]) => void;
  onError: (error: string) => void;
}

type NodeId = string;

function generateNodeId(type: string, ...parts: (string | number)[]): NodeId {
  return `${type}_${parts.join('_')}`;
}

export function LandscapeEditor({ landscape, onLandscapeUpdated, onError }: LandscapeEditorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<NodeId>>(new Set());
  const [localLandscape, setLocalLandscape] = useState<CleanedLandscape[]>(landscape);
  const [originalLandscape, setOriginalLandscape] = useState<CleanedLandscape[]>(JSON.parse(JSON.stringify(landscape)));

  React.useEffect(() => {
    setLocalLandscape(landscape);
    setOriginalLandscape(JSON.parse(JSON.stringify(landscape)));
  }, [landscape]);

  const toggleNode = useCallback((nodeId: NodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
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
      if (app.rootPackage) {
        collectNodes(app.rootPackage);
      }
    });
    setExpandedNodes(allNodes);
  }, [localLandscape]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const saveLandscape = useCallback(async () => {
    try {
      const updated = await apiClient.updateLandscape(localLandscape);
      setLocalLandscape(updated);
      setOriginalLandscape(JSON.parse(JSON.stringify(updated)));
      onLandscapeUpdated(updated);
    } catch (err: any) {
      onError(err.message || 'Failed to save landscape');
    }
  }, [localLandscape, onLandscapeUpdated, onError]);

  const reloadLandscape = useCallback(() => {
    setLocalLandscape(JSON.parse(JSON.stringify(originalLandscape)));
    setExpandedNodes(new Set());
  }, [originalLandscape]);

  const findPackage = (app: CleanedLandscape, packageName: string): CleanedPackage | null => {
    const search = (pkg: CleanedPackage): CleanedPackage | null => {
      if (pkg.name === packageName) return pkg;
      for (const subPkg of pkg.subpackages) {
        const found = search(subPkg);
        if (found) return found;
      }
      return null;
    };
    return search(app.rootPackage);
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
    return search(app.rootPackage);
  };

  const renameApp = (appIdx: number) => {
    const app = localLandscape[appIdx];
    const newName = prompt('Enter new app name:', app.name);
    if (newName && newName.trim() !== '') {
      const updated = [...localLandscape];
      updated[appIdx] = { ...app, name: newName.trim() };
      setLocalLandscape(updated);
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
          rootPackage: updatePkg(app.rootPackage),
        };
        setLocalLandscape(updated);
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
          rootPackage: updateClass(app.rootPackage),
          classes: app.classes.map((c) => (c.identifier === className ? { ...c, identifier: newName.trim() } : c)),
        };
        setLocalLandscape(updated);
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
            rootPackage: updateMethod(app.rootPackage),
            classes: app.classes.map((c) =>
              c.identifier === className
                ? {
                    ...c,
                    methods: c.methods.map((m) => (m.identifier === methodName ? { identifier: newName.trim() } : m)),
                  }
                : c
            ),
          };
          setLocalLandscape(updated);
        }
      }
    }
  };

  const addPackage = (appIdx: number) => {
    const packageName = prompt('Enter package name:', 'newpackage');
    if (packageName && packageName.trim() !== '') {
      const updated = [...localLandscape];
      const app = updated[appIdx];
      let targetPkg = app.rootPackage;
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
        rootPackage: updatePkg(app.rootPackage),
        packages: [...app.packages, newPkg],
      };
      setLocalLandscape(updated);
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
        rootPackage: updatePkg(app.rootPackage),
        packages: [...app.packages, newPkg],
      };
      setLocalLandscape(updated);
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
        rootPackage: updatePkg(app.rootPackage),
        classes: [...app.classes, newClass],
      };
      setLocalLandscape(updated);
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
        rootPackage: updateMethod(app.rootPackage),
        classes: app.classes.map((c) =>
          c.identifier === className ? { ...c, methods: [...c.methods, newMethod] } : c
        ),
        methods: [...app.methods, newMethod],
      };
      setLocalLandscape(updated);
    }
  };

  const deleteApp = (appIdx: number) => {
    if (confirm('Are you sure you want to delete this app?')) {
      const updated = localLandscape.filter((_, idx) => idx !== appIdx);
      setLocalLandscape(updated);
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
      const cleaned = removePkg(app.rootPackage);
      if (cleaned) {
        updated[appIdx] = { ...app, rootPackage: cleaned };
        setLocalLandscape(updated);
      }
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
        rootPackage: removeClass(app.rootPackage),
        classes: app.classes.filter((c) => c.identifier !== className),
      };
      setLocalLandscape(updated);
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
        rootPackage: removeMethod(app.rootPackage),
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
      setLocalLandscape(updated);
    }
  };

  const renderPackage = (pkg: CleanedPackage, appIdx: number, depth: number): React.ReactNode => {
    const pkgNodeId = generateNodeId('pkg', appIdx, pkg.name.replace(/\./g, '_'));
    const hasChildren = pkg.subpackages.length > 0 || pkg.classes.length > 0;
    const isExpanded = expandedNodes.has(pkgNodeId);

    return (
      <React.Fragment key={pkgNodeId}>
        <div
          className="tree-node group"
          onClick={(e) => {
            if (
              !(e.target as HTMLElement).closest('.action-buttons') &&
              !(e.target as HTMLElement).closest('.action-btn')
            ) {
              toggleNode(pkgNodeId);
            }
          }}
        >
          <span className="tree-toggle w-4 text-center flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <Circle className="w-2 h-2" />
            )}
          </span>
          <span className="entity-name text-green-700 dark:text-green-400 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {pkg.name}
          </span>
          <div className="action-buttons">
            <button
              className="action-btn action-btn-add-green"
              onClick={(e) => {
                e.stopPropagation();
                addSubPackage(appIdx, pkg.name);
              }}
              title="Add Subpackage"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="action-btn action-btn-add-green"
              onClick={(e) => {
                e.stopPropagation();
                addClass(appIdx, pkg.name);
              }}
              title="Add Class"
            >
              <FileCode className="w-4 h-4" />
            </button>
            <button
              className="action-btn action-btn-edit"
              onClick={(e) => {
                e.stopPropagation();
                renamePackage(appIdx, pkg.name);
              }}
              title="Rename"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              className="action-btn action-btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                deletePackage(appIdx, pkg.name);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-5">
            {pkg.classes.map((cls) => renderClass(cls, appIdx))}
            {pkg.subpackages.map((subPkg) => renderPackage(subPkg, appIdx, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderClass = (cls: CleanedClass, appIdx: number): React.ReactNode => {
    const clsNodeId = generateNodeId('cls', appIdx, cls.identifier.replace(/\./g, '_'));
    const hasChildren = cls.methods.length > 0;
    const isExpanded = expandedNodes.has(clsNodeId);

    return (
      <React.Fragment key={clsNodeId}>
        <div
          className="tree-node group"
          onClick={(e) => {
            if (
              !(e.target as HTMLElement).closest('.action-buttons') &&
              !(e.target as HTMLElement).closest('.action-btn')
            ) {
              toggleNode(clsNodeId);
            }
          }}
        >
          <span className="tree-toggle w-4 text-center flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <Circle className="w-2 h-2" />
            )}
          </span>
          <span className="entity-name text-orange-700 dark:text-orange-400 flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            {cls.identifier}
          </span>
          <div className="action-buttons">
            <button
              className="action-btn action-btn-add-orange"
              onClick={(e) => {
                e.stopPropagation();
                addMethod(appIdx, cls.identifier);
              }}
              title="Add Method"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="action-btn action-btn-edit"
              onClick={(e) => {
                e.stopPropagation();
                renameClass(appIdx, cls.identifier);
              }}
              title="Rename"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              className="action-btn action-btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteClass(appIdx, cls.identifier);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-5">{cls.methods.map((method) => renderMethod(method, appIdx, cls.identifier))}</div>
        )}
      </React.Fragment>
    );
  };

  const renderMethod = (method: { identifier: string }, appIdx: number, className: string): React.ReactNode => {
    return (
      <div key={method.identifier} className="tree-node method group">
        <span className="tree-toggle leaf w-4 text-center flex items-center justify-center">
          <Circle className="w-2 h-2" />
        </span>
        <span className="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {method.identifier}
        </span>
        <div className="action-buttons">
          <button
            className="action-btn action-btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              renameMethod(appIdx, className, method.identifier);
            }}
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteMethod(appIdx, className, method.identifier);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
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
                rootPackage: rootPkg1,
                entryPointFqn: `org.tracegenerator.${appName.trim()}.Main`,
                classes: [defaultClass],
                packages: [rootPkg2, rootPkg3],
                methods: [defaultClass.methods[0]],
              };
              setLocalLandscape([...localLandscape, newApp]);
            }
          }}
          className="material-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add App
        </button>
        <button
          type="button"
          onClick={expandAll}
          className="material-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <ChevronsDown className="w-4 h-4" />
          Expand All
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="material-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <ChevronsUp className="w-4 h-4" />
          Collapse All
        </button>
        <button type="button" onClick={saveLandscape} className="material-button px-4 py-2 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Landscape
        </button>
        <button
          type="button"
          onClick={reloadLandscape}
          className="material-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Original
        </button>
      </div>
      <div className="material-card p-4 max-h-[600px] overflow-y-auto font-mono text-sm bg-gray-50 dark:bg-gray-800">
        {localLandscape.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No landscape generated yet. Generate one above!</p>
        ) : (
          localLandscape.map((app, appIdx) => {
            const appNodeId = generateNodeId('app', appIdx);
            const hasChildren =
              app.rootPackage && (app.rootPackage.subpackages.length > 0 || app.rootPackage.classes.length > 0);
            const isExpanded = expandedNodes.has(appNodeId);

            return (
              <React.Fragment key={appNodeId}>
                <div
                  className="tree-node group"
                  onClick={(e) => {
                    if (
                      !(e.target as HTMLElement).closest('.action-buttons') &&
                      !(e.target as HTMLElement).closest('.action-btn')
                    ) {
                      toggleNode(appNodeId);
                    }
                  }}
                >
                  <span className="tree-toggle w-4 text-center flex items-center justify-center">
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    ) : (
                      <Circle className="w-2 h-2" />
                    )}
                  </span>
                  <span className="entity-name font-bold text-blue-600 dark:text-blue-400 text-base flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    {app.name}
                  </span>
                  <div className="action-buttons">
                    <button
                      className="action-btn action-btn-add"
                      onClick={(e) => {
                        e.stopPropagation();
                        addPackage(appIdx);
                      }}
                      title="Add Package"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      className="action-btn action-btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        renameApp(appIdx);
                      }}
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="action-btn action-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteApp(appIdx);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {hasChildren && isExpanded && <div className="ml-5">{renderPackage(app.rootPackage, appIdx, 0)}</div>}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
