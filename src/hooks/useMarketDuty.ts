// src/hooks/useMarketDuty.ts

import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';

export const useMarketDuty = () => {
  const [dutyDays, setDutyDays] = useState<string[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDutyDays = async () => {
      try {
        // Fetch the single shared market duty row
        const { data, error: sbError } = await supabase
          .from(TABLES.MARKET_DUTY)
          .select('*')
          .limit(1)
          .maybeSingle();

        if (sbError) throw sbError;

        if (data) {
          setDutyDays(data.duty_days ?? []);
          setRecordId(data.id);
        }
      } catch (err) {
        setError('Failed to fetch duty days');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDutyDays();
  }, []);

  const updateDutyDays = async (newDays: string[]) => {
    try {
      setLoading(true);

      if (recordId) {
        // Update existing row
        const { error: sbError } = await supabase
          .from(TABLES.MARKET_DUTY)
          .update({ duty_days: newDays, updated_at: new Date().toISOString() })
          .eq('id', recordId);

        if (sbError) throw sbError;
      } else {
        // Insert first row
        const { data, error: sbError } = await supabase
          .from(TABLES.MARKET_DUTY)
          .insert({ duty_days: newDays })
          .select()
          .single();

        if (sbError) throw sbError;
        setRecordId(data.id);
      }

      setDutyDays(newDays);
    } catch (err) {
      setError('Failed to update duty days');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNextDutyDate = (): Date | null => {
    if (!dutyDays.length) return null;

    const today = new Date();
    const currentDay = today.getDay();
    const weekDays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    const dutyDayIndices = dutyDays.map(day => weekDays.indexOf(day.toLowerCase()));
    const nextDutyIndex = dutyDayIndices.find(day => day > currentDay);

    if (nextDutyIndex !== undefined) {
      const daysUntilDuty = nextDutyIndex - currentDay;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilDuty);
      return nextDate;
    } else {
      // If no duty day found this week, get the first duty day of next week
      const firstDutyDay = Math.min(...dutyDayIndices);
      const daysUntilDuty = 7 - currentDay + firstDutyDay;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilDuty);
      return nextDate;
    }
  };

  return {
    dutyDays,
    updateDutyDays,
    getNextDutyDate,
    loading,
    error,
  };
};