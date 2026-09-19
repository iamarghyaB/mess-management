// src/hooks/useCorrectionRequests.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { CorrectionRequest } from '../types/models';
import { useMonthContext } from '../contexts/MonthContext';
import { useAuthContext } from '../contexts/AuthContext';

export const useCorrectionRequests = () => {
  const { activeMonth } = useMonthContext();
  const { member } = useAuthContext();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!activeMonth) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLES.BAZAR_CORRECTION_REQUESTS)
        .select(`
          *,
          requester:members!bazar_correction_requests_requested_by_fkey(*),
          bazar:bazars(*)
        `)
        .eq('month_id', activeMonth.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequests((data ?? []) as CorrectionRequest[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching correction requests:', err);
      setError(err.message || 'Failed to fetch correction requests');
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const requestCorrection = async (
    bazarId: string,
    oldAmount: number,
    requestedAmount: number,
    reason: string
  ) => {
    if (!activeMonth) throw new Error('No active month');
    if (!member) throw new Error('Not logged in');

    try {
      // 1. Insert correction request
      const { data, error: err } = await supabase
        .from(TABLES.BAZAR_CORRECTION_REQUESTS)
        .insert({
          bazar_id: bazarId,
          requested_by: member.id,
          month_id: activeMonth.id,
          old_amount: oldAmount,
          requested_amount: requestedAmount,
          reason,
          status: 'pending',
        })
        .select()
        .single();

      if (err) throw err;

      // 2. Add audit log
      await supabase.from(TABLES.BAZAR_AUDIT).insert({
        bazar_id: bazarId,
        action: 'CORRECTION_REQUESTED',
        performed_by: member.id,
        old_value: { amount: oldAmount },
        new_value: { requested_amount: requestedAmount, reason },
        note: `${member.name} requested correction for Bazar #${bazarId.slice(0, 8)}`,
      });

      await fetchRequests();
      return data as CorrectionRequest;
    } catch (err: any) {
      console.error('Error requesting correction:', err);
      throw err;
    }
  };

  const reviewCorrection = async (requestId: string, approve: boolean) => {
    if (!member) throw new Error('Not logged in');

    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    try {
      const now = new Date().toISOString();
      const newStatus = approve ? 'approved' : 'rejected';

      // 1. Update request status
      const { error: err } = await supabase
        .from(TABLES.BAZAR_CORRECTION_REQUESTS)
        .update({
          status: newStatus,
          reviewed_by: member.id,
          reviewed_at: now,
          edit_granted_at: approve ? now : null,
        })
        .eq('id', requestId);

      if (err) throw err;

      // 2. Add audit log
      await supabase.from(TABLES.BAZAR_AUDIT).insert({
        bazar_id: req.bazar_id,
        action: approve ? 'CORRECTION_APPROVED' : 'CORRECTION_REJECTED',
        performed_by: member.id,
        note: `Manager ${member.name} ${approve ? 'approved' : 'rejected'} correction request by ${req.requester?.name || 'member'}`,
      });

      await fetchRequests();
    } catch (err: any) {
      console.error('Error reviewing correction request:', err);
      throw err;
    }
  };

  const markEditUsed = async (requestId: string) => {
    try {
      await supabase
        .from(TABLES.BAZAR_CORRECTION_REQUESTS)
        .update({ edit_used_at: new Date().toISOString() })
        .eq('id', requestId);

      await fetchRequests();
    } catch (err) {
      console.error('Error marking edit as used:', err);
    }
  };

  return {
    requests,
    pendingRequests: requests.filter(r => r.status === 'pending'),
    loading,
    error,
    refresh: fetchRequests,
    requestCorrection,
    reviewCorrection,
    markEditUsed,
  };
};
