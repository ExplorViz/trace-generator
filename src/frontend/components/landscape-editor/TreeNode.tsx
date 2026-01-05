import React, { useState } from 'react';

interface TreeNodeProps {
  nodeId: string;
  onToggle: (nodeId: string) => void;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDropTarget?: boolean;
}

export function TreeNode({
  nodeId,
  onToggle,
  children,
  className = '',
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave: propOnDragLeave,
  onDrop,
  isDropTarget = false,
}: TreeNodeProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.action-buttons') && !(e.target as HTMLElement).closest('.action-btn')) {
      onToggle(nodeId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragOver) {
      onDragOver(e);
    } else if (onDrop) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (propOnDragLeave) {
      propOnDragLeave(e);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (onDrop) {
      onDrop(e);
    }
  };

  return (
    <div
      className={`tree-node group ${className} ${isDraggingOver || isDropTarget ? 'drag-over' : ''} ${draggable ? 'cursor-move' : ''}`}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
