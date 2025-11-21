import { ChevronDown, ChevronRight, Circle, FileCode, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { ClassNode } from './ClassNode';
import { PackageNodeProps } from './types';
import { generateNodeId } from './utils';

export function PackageNode({ pkg, appIdx, depth, expandedNodes, handlers }: PackageNodeProps) {
  const pkgNodeId = generateNodeId('pkg', appIdx, pkg.name.replace(/\./g, '_'));
  const hasChildren = pkg.subpackages.length > 0 || pkg.classes.length > 0;
  const isExpanded = expandedNodes.has(pkgNodeId);

  return (
    <>
      <div
        className="tree-node group"
        onClick={(e) => {
          if (
            !(e.target as HTMLElement).closest('.action-buttons') &&
            !(e.target as HTMLElement).closest('.action-btn')
          ) {
            handlers.toggleNode(pkgNodeId);
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
        <span className="entity-name text-success flex items-center gap-2">
          <Package className="w-5 h-5" />
          {pkg.name}
        </span>
        <div className="action-buttons">
          <button
            className="action-btn action-btn-add-green"
            onClick={(e) => {
              e.stopPropagation();
              handlers.addSubPackage(appIdx, pkg.name);
            }}
            title="Add Subpackage"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-add-green"
            onClick={(e) => {
              e.stopPropagation();
              handlers.addClass(appIdx, pkg.name);
            }}
            title="Add Class"
          >
            <FileCode className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handlers.renamePackage(appIdx, pkg.name);
            }}
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handlers.deletePackage(appIdx, pkg.name);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-5">
          {pkg.classes.map((cls) => {
            const clsNodeId = generateNodeId('cls', appIdx, cls.identifier.replace(/\./g, '_'));
            return (
              <ClassNode key={clsNodeId} cls={cls} appIdx={appIdx} expandedNodes={expandedNodes} handlers={handlers} />
            );
          })}
          {pkg.subpackages.map((subPkg) => {
            const subPkgNodeId = generateNodeId('pkg', appIdx, subPkg.name.replace(/\./g, '_'));
            return (
              <PackageNode
                key={subPkgNodeId}
                pkg={subPkg}
                appIdx={appIdx}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                handlers={handlers}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
