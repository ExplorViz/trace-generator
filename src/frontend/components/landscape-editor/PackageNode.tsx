import { FileCode, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { ActionButtons } from './ActionButtons';
import { ClassNode } from './ClassNode';
import { TreeNode } from './TreeNode';
import { TreeToggle } from './TreeToggle';
import { PackageNodeProps } from './types';
import { generateNodeId } from './utils';

export function PackageNode({ pkg, appIdx, depth, expandedNodes, handlers }: PackageNodeProps) {
  const pkgNodeId = generateNodeId('pkg', appIdx, pkg.name.replace(/\./g, '_'));
  const hasChildren = pkg.subpackages.length > 0 || pkg.classes.length > 0;
  const isExpanded = expandedNodes.has(pkgNodeId);

  const actionButtons = [
    {
      icon: Plus,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.addSubPackage(appIdx, pkg.name);
      },
      title: 'Add Subpackage',
      variant: 'add-green' as const,
    },
    {
      icon: FileCode,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.addClass(appIdx, pkg.name);
      },
      title: 'Add Class',
      variant: 'add-green' as const,
    },
    {
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.renamePackage(appIdx, pkg.name);
      },
      title: 'Rename',
      variant: 'edit' as const,
    },
    {
      icon: Trash2,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.deletePackage(appIdx, pkg.name);
      },
      title: 'Delete',
      variant: 'delete' as const,
    },
  ];

  return (
    <>
      <TreeNode nodeId={pkgNodeId} onToggle={handlers.toggleNode}>
        <TreeToggle hasChildren={hasChildren} isExpanded={isExpanded} />
        <span className="entity-name text-success flex items-center gap-2">
          <Package className="w-5 h-5" />
          {pkg.name}
        </span>
        <ActionButtons buttons={actionButtons} />
      </TreeNode>
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
