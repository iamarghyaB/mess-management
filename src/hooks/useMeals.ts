// src/hooks/useMeals.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Meal } from '../types/models';
import { useMonthContext } from '../contexts/MonthContext';

export const useMeals = (selectedDate?: string) => {
  const { activeMonth } = useMonthContext();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetDate = selectedDate || new Date().toISOString().split('T')[0];

  const fetchMeals = useCallback(async () => {
    if (!activeMonth) {
      setMeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLES.MEALS)
        .select(`
          *,
          member:members(*)
        `)
        .eq('month_id', activeMonth.id)
        .eq('date', targetDate);

      if (err) throw err;
      setMeals((data ?? []) as Meal[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching meals:', err);
      setError(err.message || 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  }, [activeMonth, targetDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const upsertMeal = async (
    memberId: string,
    breakfast: 0 | 1,
    lunch: 0 | 1,
    dinner: 0 | 1,
    dateToSave?: string
  ) => {
    if (!activeMonth) throw new Error('No active month found');

    const date = dateToSave || targetDate;

    try {
      const { data, error: err } = await supabase
        .from(TABLES.MEALS)
        .upsert(
          {
            date,
            member_id: memberId,
            month_id: activeMonth.id,
            breakfast,
            lunch,
            dinner,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'date,member_id' }
        )
        .select(`*, member:members(*)`)
        .single();

      if (err) throw err;

      setMeals(prev => {
        const index = prev.findIndex(m => m.member_id === memberId && m.date === date);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data as Meal;
          return updated;
        } else {
          return [...prev, data as Meal];
        }
      });

      return data as Meal;
    } catch (err: any) {
      console.error('Error saving meal entry:', err);
      throw err;
    }
  };

  return {
    meals,
    loading,
    error,
    refresh: fetchMeals,
    upsertMeal,
  };
};
