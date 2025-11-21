import { ChevronDown, ChevronRight, Circle, FileCode, Pencil, Plus, Trash2 } from 'lucide-react';
import { MethodNode } from './MethodNode';
import { ClassNodeProps } from './types';
import { generateNodeId } from './utils';

export function ClassNode({ cls, appIdx, expandedNodes, handlers }: ClassNodeProps) {
  const clsNodeId = generateNodeId('cls', appIdx, cls.identifier.replace(/\./g, '_'));
  const hasChildren = cls.methods.length > 0;
  const isExpanded = expandedNodes.has(clsNodeId);

  return (
    <>
      <div
        className="tree-node group"
        onClick={(e) => {
          if (
            !(e.target as HTMLElement).closest('.action-buttons') &&
            !(e.target as HTMLElement).closest('.action-btn')
          ) {
            handlers.toggleNode(clsNodeId);
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
        <span className="entity-name text-secondary-color flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          {cls.identifier}
        </span>
        <div className="action-buttons">
          <button
            className="action-btn action-btn-add-orange"
            onClick={(e) => {
              e.stopPropagation();
              handlers.addMethod(appIdx, cls.identifier);
            }}
            title="Add Method"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              handlers.renameClass(appIdx, cls.identifier);
            }}
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={(e) => {
              e.stopPropagation();
              handlers.deleteClass(appIdx, cls.identifier);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-5">
          {cls.methods.map((method) => (
            <MethodNode
              key={method.identifier}
              method={method}
              appIdx={appIdx}
              className={cls.identifier}
              handlers={handlers}
            />
          ))}
        </div>
      )}
    </>
  );
}
