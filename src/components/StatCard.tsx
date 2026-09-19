// src/components/StatCard.tsx

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'amber' | 'purple' | 'teal' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  return (
    <div className={`stat-card ${variant}`}>
      <div className={`stat-icon ${variant}`}>
        <Icon size={20} />
      </div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
    </div>
  );
};
