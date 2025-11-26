import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  variant?: 'add' | 'add-green' | 'add-orange' | 'edit' | 'delete';
}

export function ActionButton({ icon: Icon, onClick, title, variant = 'edit' }: ActionButtonProps) {
  const variantClass = {
    add: 'action-btn-add',
    'add-green': 'action-btn-add-green',
    'add-orange': 'action-btn-add-orange',
    edit: 'action-btn-edit',
    delete: 'action-btn-delete',
  }[variant];

  return (
    <button className={`action-btn ${variantClass}`} onClick={onClick} title={title}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
