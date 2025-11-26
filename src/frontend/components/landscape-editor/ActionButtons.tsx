import { LucideIcon } from 'lucide-react';
import React from 'react';
import { ActionButton } from './ActionButton';

interface ActionButtonConfig {
  icon: LucideIcon;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  variant?: 'add' | 'add-green' | 'add-orange' | 'edit' | 'delete';
}

interface ActionButtonsProps {
  buttons: ActionButtonConfig[];
}

export function ActionButtons({ buttons }: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      {buttons.map((button, index) => (
        <ActionButton
          key={index}
          icon={button.icon}
          onClick={button.onClick}
          title={button.title}
          variant={button.variant}
        />
      ))}
    </div>
  );
}
