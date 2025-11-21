import { AppWindow, ChevronDown, ChevronRight, Circle, Pencil, Plus, Trash2 } from 'lucide-react';
import { PackageNode } from './PackageNode';
import { AppNodeProps, NodeId } from './types';

export function AppNode({
  app,
  appIdx,
  isExpanded,
  hasChildren,
  handlers,
  expandedNodes,
}: AppNodeProps & { expandedNodes: Set<NodeId> }) {
  const appNodeId = `app_${appIdx}`;

  return (
    <>
      <div
        className="tree-node group"
        onClick={(e) => {
          if (
            !(e.target as HTMLElement).closest('.action-buttons') &&
            !(e.target as HTMLElement).closest('.action-btn')
          ) {
            handlers.toggleNode(appNodeId);
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
        <span className="entity-name font-bold text-primary-color text-base flex items-center gap-2">
          <AppWindow className="w-5 h-5" />
          {app.name}
        </span>
        <div className="action-buttons">
          <button
            className="action-btn action-btn-add"
            onClick={(e) => {
              e.stopPropagation();
              handlers.addPackage(appIdx);
            }}
            title="Add Package"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handlers.renameApp(appIdx);
            }}
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handlers.deleteApp(appIdx);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && app.rootPackage && (
        <div className="ml-5">
          <PackageNode
            pkg={app.rootPackage}
            appIdx={appIdx}
            depth={0}
            expandedNodes={expandedNodes}
            handlers={handlers}
          />
        </div>
      )}
    </>
  );
}
