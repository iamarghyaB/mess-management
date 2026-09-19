// src/hooks/usePayments.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Payment } from '../types/models';
import { useMonthContext } from '../contexts/MonthContext';
import { useAuthContext } from '../contexts/AuthContext';

export const usePayments = () => {
  const { activeMonth } = useMonthContext();
  const { member } = useAuthContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!activeMonth) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLES.PAYMENTS)
        .select(`
          *,
          member:members!payments_member_id_fkey(*)
        `)
        .eq('month_id', activeMonth.id)
        .order('date', { ascending: false });

      if (err) throw err;
      setPayments((data ?? []) as Payment[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const submitPayment = async (
    amount: number,
    date: string,
    payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other',
    note?: string
  ) => {
    if (!activeMonth) throw new Error('No active month');
    if (!member) throw new Error('Not logged in');

    try {
      const { data, error: err } = await supabase
        .from(TABLES.PAYMENTS)
        .insert({
          member_id: member.id,
          month_id: activeMonth.id,
          amount,
          date,
          payment_method,
          note: note ?? null,
          status: 'pending',
        })
        .select()
        .single();

      if (err) throw err;
      await fetchPayments();
      return data as Payment;
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      throw err;
    }
  };

  const reviewPayment = async (paymentId: string, status: 'confirmed' | 'rejected') => {
    if (!member) throw new Error('Not logged in');

    try {
      const { error: err } = await supabase
        .from(TABLES.PAYMENTS)
        .update({
          status,
          reviewed_by: member.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (err) throw err;
      await fetchPayments();
    } catch (err: any) {
      console.error('Error reviewing payment:', err);
      throw err;
    }
  };

  return {
    payments,
    pendingPayments: payments.filter(p => p.status === 'pending'),
    confirmedPayments: payments.filter(p => p.status === 'confirmed'),
    loading,
    error,
    refresh: fetchPayments,
    submitPayment,
    reviewPayment,
  };
};
