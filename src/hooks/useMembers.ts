// src/hooks/useMembers.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Member } from '../types/models';

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLES.MEMBERS)
        .select('*')
        .order('name', { ascending: true });

      if (err) throw err;
      setMembers((data ?? []) as Member[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (memberData: { name: string; email: string; phone?: string }) => {
    try {
      const { data, error: err } = await supabase
        .from(TABLES.MEMBERS)
        .insert({
          name: memberData.name,
          email: memberData.email,
          phone: memberData.phone ?? null,
          joining_date: new Date().toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (err) throw err;
      await fetchMembers();
      return data as Member;
    } catch (err: any) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const setMemberStatus = async (memberId: string, status: 'active' | 'inactive') => {
    try {
      const { error: err } = await supabase
        .from(TABLES.MEMBERS)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (err) throw err;
      await fetchMembers();
    } catch (err: any) {
      console.error('Error updating member status:', err);
      throw err;
    }
  };

  return {
    members,
    activeMembers: members.filter(m => m.status === 'active'),
    loading,
    error,
    refresh: fetchMembers,
    addMember,
    setMemberStatus,
  };
};
