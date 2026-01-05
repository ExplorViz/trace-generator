import { FileCode, Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { ActionButtons } from './ActionButtons';
import { MethodNode } from './MethodNode';
import { TreeNode } from './TreeNode';
import { TreeToggle } from './TreeToggle';
import { ClassNodeProps } from './types';
import { generateNodeId } from './utils';

export function ClassNode({ cls, appIdx, expandedNodes, handlers }: ClassNodeProps) {
  const clsNodeId = generateNodeId('cls', appIdx, cls.identifier.replace(/\./g, '_'));
  const hasChildren = cls.methods.length > 0;
  const isExpanded = expandedNodes.has(clsNodeId);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'class', appIdx, className: cls.identifier }));
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Check if the drag contains text/plain data (our drag data format)
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    try {
      const dragData = JSON.parse(data);
      if (dragData.type === 'method' && dragData.className !== cls.identifier) {
        handlers.moveMethod(dragData.appIdx, dragData.className, dragData.methodName, appIdx, cls.identifier);
      }
    } catch (err) {
      console.error(err);
      handlers.onError('Failed to process drop operation');
    }
  };

  const actionButtons = [
    {
      icon: Plus,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.addMethod(appIdx, cls.identifier);
      },
      title: 'Add Method',
      variant: 'add-orange' as const,
    },
    {
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.renameClass(appIdx, cls.identifier);
      },
      title: 'Rename',
      variant: 'edit' as const,
    },
    {
      icon: Trash2,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handlers.deleteClass(appIdx, cls.identifier);
      },
      title: 'Delete',
      variant: 'delete' as const,
    },
  ];

  return (
    <>
      <TreeNode
        nodeId={clsNodeId}
        onToggle={handlers.toggleNode}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        isDropTarget={isDragOver}
      >
        <TreeToggle hasChildren={hasChildren} isExpanded={isExpanded} />
        <span className={`entity-name text-secondary-color flex items-center gap-2 ${isDragOver ? 'opacity-50' : ''}`}>
          <FileCode className="w-5 h-5" />
          {cls.identifier}
        </span>
        <ActionButtons buttons={actionButtons} />
      </TreeNode>
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
