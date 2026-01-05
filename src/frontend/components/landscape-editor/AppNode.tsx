import { AppWindow, Pencil, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { ActionButtons } from './ActionButtons';
import { PackageNode } from './PackageNode';
import { TreeNode } from './TreeNode';
import { TreeToggle } from './TreeToggle';
import { AppNodeProps, NodeId } from './types';
import { generateNodeId } from './utils';

export function AppNode({
  app,
  appIdx,
  isExpanded,
  hasChildren,
  handlers,
  expandedNodes,
}: AppNodeProps & { expandedNodes: Set<NodeId> }) {
  const appNodeId = `app_${appIdx}`;

  const actionButtons = [
    {
      icon: Plus,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.addRootPackage(appIdx);
      },
      title: 'Add Root Package',
      variant: 'add' as const,
    },
    {
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.renameApp(appIdx);
      },
      title: 'Rename',
      variant: 'edit' as const,
    },
    {
      icon: Trash2,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.deleteApp(appIdx);
      },
      title: 'Delete',
      variant: 'delete' as const,
    },
  ];

  return (
    <>
      <TreeNode nodeId={appNodeId} onToggle={handlers.toggleNode}>
        <TreeToggle hasChildren={hasChildren} isExpanded={isExpanded} />
        <span className="entity-name font-bold text-primary-color text-base flex items-center gap-2">
          <AppWindow className="w-5 h-5" />
          {app.name}
        </span>
        <ActionButtons buttons={actionButtons} />
      </TreeNode>
      {hasChildren && isExpanded && (
        <div className="ml-5">
          {app.rootPackages.map((rootPkg) => (
            <PackageNode
              key={generateNodeId('pkg', appIdx, rootPkg.name.replace(/\./g, '_'))}
              pkg={rootPkg}
              appIdx={appIdx}
              depth={0}
              expandedNodes={expandedNodes}
              handlers={handlers}
            />
          ))}
        </div>
      )}
    </>
  );
}
