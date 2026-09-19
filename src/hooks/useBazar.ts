// src/hooks/useBazar.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Bazar, BazarItem, BazarAudit } from '../types/models';
import { useMonthContext } from '../contexts/MonthContext';
import { useAuthContext } from '../contexts/AuthContext';

export const useBazar = () => {
  const { activeMonth } = useMonthContext();
  const { member } = useAuthContext();
  const [bazars, setBazars] = useState<Bazar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBazars = useCallback(async () => {
    if (!activeMonth) {
      setBazars([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLES.BAZARS)
        .select(`
          *,
          purchaser:members!bazars_purchased_by_fkey(*),
          items:bazar_items(*)
        `)
        .eq('month_id', activeMonth.id)
        .order('date', { ascending: false });

      if (err) throw err;
      setBazars((data ?? []) as Bazar[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bazars:', err);
      setError(err.message || 'Failed to fetch bazar entries');
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchBazars();
  }, [fetchBazars]);

  const addBazar = async (
    date: string,
    items: { item_name: string; quantity: number; price: number }[],
    note?: string
  ) => {
    if (!activeMonth) throw new Error('No active month');
    if (!member) throw new Error('Not logged in');

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    try {
      // 1. Create Bazar record
      const { data: bazarData, error: bazarErr } = await supabase
        .from(TABLES.BAZARS)
        .insert({
          date,
          month_id: activeMonth.id,
          purchased_by: member.id,
          total_amount: totalAmount,
          note: note ?? null,
          status: 'active',
        })
        .select()
        .single();

      if (bazarErr) throw bazarErr;

      // 2. Insert items
      const itemsToInsert = items.map(item => ({
        bazar_id: bazarData.id,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsErr } = await supabase
        .from(TABLES.BAZAR_ITEMS)
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      // 3. Write Audit Log
      await supabase.from(TABLES.BAZAR_AUDIT).insert({
        bazar_id: bazarData.id,
        action: 'CREATED',
        performed_by: member.id,
        new_value: { total_amount: totalAmount, items_count: items.length, note },
        note: `${member.name} created Bazar record #${bazarData.id.slice(0, 8)}`,
      });

      await fetchBazars();
      return bazarData as Bazar;
    } catch (err: any) {
      console.error('Error adding bazar:', err);
      throw err;
    }
  };

  const updateBazar = async (
    bazarId: string,
    items: { item_name: string; quantity: number; price: number }[],
    note?: string,
    auditNote?: string
  ) => {
    if (!member) throw new Error('Not logged in');

    const existing = bazars.find(b => b.id === bazarId);
    const newTotal = items.reduce((sum, item) => sum + item.price, 0);

    try {
      // 1. Delete existing items
      await supabase.from(TABLES.BAZAR_ITEMS).delete().eq('bazar_id', bazarId);

      // 2. Insert new items
      const itemsToInsert = items.map(item => ({
        bazar_id: bazarId,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
      }));
      await supabase.from(TABLES.BAZAR_ITEMS).insert(itemsToInsert);

      // 3. Update main Bazar record
      await supabase
        .from(TABLES.BAZARS)
        .update({
          total_amount: newTotal,
          note: note ?? null,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bazarId);

      // 4. Audit trail
      await supabase.from(TABLES.BAZAR_AUDIT).insert({
        bazar_id: bazarId,
        action: 'EDITED',
        performed_by: member.id,
        old_value: existing ? { total_amount: existing.total_amount, note: existing.note } : null,
        new_value: { total_amount: newTotal, note },
        note: auditNote || `${member.name} edited Bazar #${bazarId.slice(0, 8)}`,
      });

      await fetchBazars();
    } catch (err: any) {
      console.error('Error updating bazar:', err);
      throw err;
    }
  };

  const getBazarAudit = async (bazarId: string): Promise<BazarAudit[]> => {
    try {
      const { data, error: err } = await supabase
        .from(TABLES.BAZAR_AUDIT)
        .select(`
          *,
          performer:members!bazar_audit_performed_by_fkey(*)
        `)
        .eq('bazar_id', bazarId)
        .order('timestamp', { ascending: false });

      if (err) throw err;
      return (data ?? []) as BazarAudit[];
    } catch (err) {
      console.error('Error fetching audit log:', err);
      return [];
    }
  };

  return {
    bazars,
    loading,
    error,
    refresh: fetchBazars,
    addBazar,
    updateBazar,
    getBazarAudit,
  };
};
