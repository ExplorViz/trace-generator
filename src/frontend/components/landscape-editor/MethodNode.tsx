import { Pencil, SquareFunction, Trash2 } from 'lucide-react';
import { MethodNodeProps } from './types';

export function MethodNode({ method, appIdx, className, handlers }: MethodNodeProps) {
  return (
    <div className="tree-node method group">
      <span className="text-muted text-sm flex items-center gap-2 ml-8">
        <SquareFunction className="w-4 h-4" />
        {method.identifier}
      </span>
      <div className="action-buttons">
        <button
          className="action-btn action-btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            handlers.renameMethod(appIdx, className, method.identifier);
          }}
          title="Rename"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          className="action-btn action-btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            handlers.deleteMethod(appIdx, className, method.identifier);
          }}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
