// src/hooks/useBalance.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { MonthSummary, MemberBalance, Member } from '../types/models';
import { useMonthContext } from '../contexts/MonthContext';

export const useBalance = (monthIdOverride?: string) => {
  const { activeMonth } = useMonthContext();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetMonthId = monthIdOverride || activeMonth?.id;

  const calculateBalance = useCallback(async () => {
    if (!targetMonthId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch Month record
      const { data: monthData, error: mErr } = await supabase
        .from(TABLES.MONTHS)
        .select(`*, manager:members!months_manager_id_fkey(*)`)
        .eq('id', targetMonthId)
        .single();

      if (mErr) throw mErr;

      // 2. Fetch all members
      const { data: membersData, error: memErr } = await supabase
        .from(TABLES.MEMBERS)
        .select('*');

      if (memErr) throw memErr;
      const members = (membersData ?? []) as Member[];

      // 3. Fetch total meals for this month
      const { data: mealsData, error: mealErr } = await supabase
        .from(TABLES.MEALS)
        .select('*')
        .eq('month_id', targetMonthId);

      if (mealErr) throw mealErr;

      // 4. Fetch total bazar expenses
      const { data: bazarsData, error: bazErr } = await supabase
        .from(TABLES.BAZARS)
        .select('*')
        .eq('month_id', targetMonthId);

      if (bazErr) throw bazErr;

      // 5. Fetch total payments
      const { data: paymentsData, error: payErr } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('month_id', targetMonthId);

      if (payErr) throw payErr;

      // 6. Fetch other costs
      const { data: otherData, error: othErr } = await supabase
        .from(TABLES.OTHER_COSTS)
        .select('*')
        .eq('month_id', targetMonthId);

      if (othErr) throw othErr;

      // ─── AGGREGATIONS ───────────────────────────────────────────────
      const foodExpense = (bazarsData ?? []).reduce((sum, b) => sum + Number(b.total_amount), 0);
      const otherExpense = (otherData ?? []).reduce((sum, o) => sum + Number(o.amount), 0);
      const totalExpense = foodExpense + otherExpense;

      const totalMeals = (mealsData ?? []).reduce((sum, m) => sum + (Number(m.total_meal) || 0), 0);
      const mealRate = totalMeals > 0 ? foodExpense / totalMeals : 0;

      const activeMemberCount = members.filter(m => m.status === 'active').length || members.length || 1;
      const otherCostPerMember = otherExpense / activeMemberCount;

      // Member-wise calculation
      const memberBalances: MemberBalance[] = members.map(mem => {
        const memMeals = (mealsData ?? [])
          .filter(m => m.member_id === mem.id)
          .reduce((sum, m) => sum + (Number(m.total_meal) || 0), 0);

        const memPaid = (paymentsData ?? [])
          .filter(p => p.member_id === mem.id && p.status === 'confirmed')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const mealCost = memMeals * mealRate;
        const otherCostShare = mem.status === 'active' ? otherCostPerMember : 0;
        const totalPayable = mealCost + otherCostShare;
        const balance = memPaid - totalPayable;

        return {
          member: mem,
          totalMeals: memMeals,
          mealCost,
          otherCostShare,
          totalPayable,
          totalPaid: memPaid,
          balance,
        };
      });

      const totalCollected = memberBalances.reduce((sum, b) => sum + b.totalPaid, 0);
      const totalDue = memberBalances
        .filter(b => b.balance < 0)
        .reduce((sum, b) => sum + Math.abs(b.balance), 0);

      setSummary({
        month: monthData,
        totalMembers: activeMemberCount,
        totalMeals,
        foodExpense,
        otherExpense,
        totalExpense,
        mealRate,
        totalCollected,
        totalDue,
        memberBalances,
      });

      setError(null);
    } catch (err: any) {
      console.error('Error calculating balance summary:', err);
      setError(err.message || 'Failed to calculate balance summary');
    } finally {
      setLoading(false);
    }
  }, [targetMonthId]);

  useEffect(() => {
    calculateBalance();
  }, [calculateBalance]);

  return {
    summary,
    loading,
    error,
    refresh: calculateBalance,
  };
};
