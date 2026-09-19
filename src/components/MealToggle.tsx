// src/components/MealToggle.tsx

import React from 'react';
import { Utensils } from 'lucide-react';

interface MealToggleProps {
  label: string;
  sublabel: string;
  active: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export const MealToggle: React.FC<MealToggleProps> = ({
  label,
  sublabel,
  active,
  disabled = false,
  onChange,
}) => {
  return (
    <div
      className={`meal-toggle-item ${active ? 'active' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !disabled && onChange(!active)}
    >
      <div className="flex items-center gap-3">
        <Utensils size={16} className={active ? 'text-green' : 'text-muted'} />
        <div>
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs text-muted">{sublabel}</div>
        </div>
      </div>
      <div className={`meal-toggle-switch ${active ? 'on' : ''}`}>
        <div className="meal-toggle-knob" />
      </div>
    </div>
  );
};
