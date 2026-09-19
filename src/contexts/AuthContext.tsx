// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, TABLES } from '../lib/supabase';
import { Member, AuthContextType } from '../types/models';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or Auto-create Member profile linked to auth user
  const fetchMember = async (userId: string) => {
    try {
      // 1. Try to find by user_id
      const { data, error } = await supabase
        .from(TABLES.MEMBERS)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setMember(data as Member);
        return;
      }

      // 2. Try to find by email
      const { data: userAuth } = await supabase.auth.getUser();
      const userEmail = userAuth?.user?.email;

      if (userEmail) {
        const { data: dataByEmail } = await supabase
          .from(TABLES.MEMBERS)
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (dataByEmail) {
          // Link user_id to existing member record
          await supabase
            .from(TABLES.MEMBERS)
            .update({ user_id: userId })
            .eq('id', dataByEmail.id);
          setMember({ ...dataByEmail, user_id: userId } as Member);
          return;
        }

        // 3. Auto-create member record if it doesn't exist
        const nameFromMeta = userAuth?.user?.user_metadata?.name || userEmail.split('@')[0];
        const { data: createdMember, error: createErr } = await supabase
          .from(TABLES.MEMBERS)
          .insert({
            user_id: userId,
            name: nameFromMeta,
            email: userEmail,
            joining_date: new Date().toISOString().split('T')[0],
            status: 'active',
          })
          .select()
          .single();

        if (!createErr && createdMember) {
          setMember(createdMember as Member);
        }
      }
    } catch (err) {
      console.error('Failed to load/create member profile:', err);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id);
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data.user) {
      await fetchMember(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data.user) {
      const { data: newMember, error: memError } = await supabase
        .from(TABLES.MEMBERS)
        .insert({
          user_id: data.user.id,
          name,
          email,
          phone: phone ?? null,
          joining_date: new Date().toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (!memError && newMember) {
        setMember(newMember as Member);
      }
    }

    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
