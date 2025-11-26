import { ChevronDown, ChevronRight, Circle } from 'lucide-react';

interface TreeToggleProps {
  hasChildren: boolean;
  isExpanded: boolean;
}

export function TreeToggle({ hasChildren, isExpanded }: TreeToggleProps) {
  return (
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
  );
}
