import React from 'react';

interface TreeNodeProps {
  nodeId: string;
  onToggle: (nodeId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function TreeNode({ nodeId, onToggle, children, className = '' }: TreeNodeProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.action-buttons') && !(e.target as HTMLElement).closest('.action-btn')) {
      onToggle(nodeId);
    }
  };

  return (
    <div className={`tree-node group ${className}`} onClick={handleClick}>
      {children}
    </div>
  );
}
