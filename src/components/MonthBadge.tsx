// src/components/MonthBadge.tsx

import React from 'react';
import { Calendar, Lock, CheckCircle2 } from 'lucide-react';
import { Month } from '../types/models';
import { formatMonthYear } from '../lib/supabase';

interface MonthBadgeProps {
  month: Month | null;
}

export const MonthBadge: React.FC<MonthBadgeProps> = ({ month }) => {
  if (!month) {
    return (
      <div className="month-badge">
        <Calendar size={14} className="text-muted" />
        <span>No Active Month</span>
      </div>
    );
  }

  const isClosed = month.status === 'closed';

  return (
    <div className={`month-badge ${isClosed ? 'border-amber-500/30' : ''}`}>
      <Calendar size={14} className={isClosed ? 'text-amber' : 'text-blue'} />
      <span>{formatMonthYear(month.month, month.year)}</span>
      {isClosed ? (
        <span className="badge badge-closed flex items-center gap-1">
          <Lock size={10} /> Closed
        </span>
      ) : (
        <span className="badge badge-active flex items-center gap-1">
          <CheckCircle2 size={10} /> Active
        </span>
      )}
    </div>
  );
};
