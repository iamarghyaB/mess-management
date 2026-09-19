// src/hooks/useContributions.ts

import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Contribution } from '../types/models';
import { useExpenses } from './useExpenses';

export const useContributions = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getTotalExpenses } = useExpenses();

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from(TABLES.CONTRIBUTIONS)
        .select('*')
        .order('date', { ascending: false });

      if (sbError) throw sbError;

      const contributionsList: Contribution[] = (data ?? []).map((row: any) => ({
        id: row.id,
        date: new Date(row.date),
        amount: Number(row.amount),
        status: row.status as 'pending' | 'completed',
      }));

      setContributions(contributionsList);
    } catch (err) {
      setError('Failed to fetch contributions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const addContribution = async (contributionData: Omit<Contribution, 'id'>) => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from(TABLES.CONTRIBUTIONS)
        .insert({
          date: contributionData.date.toISOString(),
          amount: contributionData.amount,
          status: contributionData.status ?? 'pending',
        })
        .select()
        .single();

      if (sbError) throw sbError;

      const newContribution: Contribution = {
        id: data.id,
        date: new Date(data.date),
        amount: Number(data.amount),
        status: data.status as 'pending' | 'completed',
      };

      setContributions(prev => [newContribution, ...prev]);
      return data.id as string;
    } catch (err) {
      setError('Failed to add contribution');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalContributions = () => {
    return contributions.reduce((total, contribution) => total + contribution.amount, 0);
  };

  const getBalance = () => {
    const totalContributions = getTotalContributions();
    const totalExpenses = getTotalExpenses();
    return totalContributions - totalExpenses;
  };

  const getMonthlyContributions = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return contributions.filter(contribution => {
      const contributionDate = new Date(contribution.date);
      return (
        contributionDate.getMonth() === currentMonth &&
        contributionDate.getFullYear() === currentYear
      );
    });
  };

  return {
    contributions,
    addContribution,
    getTotalContributions,
    getMonthlyContributions,
    getBalance,
    loading,
    error,
    refresh: fetchContributions,
  };
};