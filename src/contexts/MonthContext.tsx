// src/contexts/MonthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Month, MonthContextType } from '../types/models';
import { useAuthContext } from './AuthContext';

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export const MonthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { member } = useAuthContext();
  const [activeMonth, setActiveMonth] = useState<Month | null>(null);
  const [allMonths, setAllMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonths = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLES.MONTHS)
        .select(`
          *,
          manager:members!months_manager_id_fkey(*)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const monthsList = (data ?? []) as Month[];
      setAllMonths(monthsList);

      // Find the active month
      const active = monthsList.find(m => m.status === 'active') ?? monthsList[0] ?? null;
      setActiveMonth(active);
    } catch (err) {
      console.error('Failed to fetch months:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  const isCurrentManager = Boolean(
    activeMonth &&
    activeMonth.status === 'active' &&
    member &&
    activeMonth.manager_id === member.id
  );

  return (
    <MonthContext.Provider
      value={{
        activeMonth,
        allMonths,
        isCurrentManager,
        loading,
        refresh: fetchMonths,
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

export const useMonthContext = (): MonthContextType => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};
