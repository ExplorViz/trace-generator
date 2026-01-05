import { Pencil, SquareFunction, Trash2 } from 'lucide-react';
import React from 'react';
import { ActionButtons } from './ActionButtons';
import { MethodNodeProps } from './types';

export function MethodNode({ method, appIdx, className, handlers }: MethodNodeProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'method', appIdx, className, methodName: method.identifier })
    );
    e.stopPropagation();
  };

  const actionButtons = [
    {
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.renameMethod(appIdx, className, method.identifier);
      },
      title: 'Rename',
      variant: 'edit' as const,
    },
    {
      icon: Trash2,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.deleteMethod(appIdx, className, method.identifier);
      },
      title: 'Delete',
      variant: 'delete' as const,
    },
  ];

  return (
    <div
      className="tree-node method group cursor-move"
      draggable={true}
      onDragStart={handleDragStart}
    >
      <span className="text-muted text-sm flex items-center gap-2 ml-8">
        <SquareFunction className="w-4 h-4" />
        {method.identifier}
      </span>
      <ActionButtons buttons={actionButtons} />
    </div>
  );
}
