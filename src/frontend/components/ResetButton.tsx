import { RotateCcw } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
  title?: string;
  className?: string;
}

export function ResetButton({ onReset, title = 'Reset to default values', className = '' }: ResetButtonProps) {
  return (
    <button
      type="button"
      onClick={onReset}
      className={`action-btn action-btn-edit flex items-center gap-2 ${className}`}
      title={title}
    >
      <RotateCcw className="w-4 h-4" />
      <span className="text-sm">Reset</span>
    </button>
  );
}
